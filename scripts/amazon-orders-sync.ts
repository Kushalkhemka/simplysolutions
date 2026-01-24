/**
 * Amazon SP-API Orders Sync Script
 * Fixed: Properly maps ASIN → FSN using amazon_asin_mapping table
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Use absolute path for .env.local to work with cron jobs
const envPath = path.resolve(__dirname, '..', '.env.local');
dotenv.config({ path: envPath });
console.log(`Loading env from: ${envPath}`);

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    merchantToken: process.env.AMAZON_SP_MERCHANT_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    // India is in EU region for SP-API
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Get LWA access token
async function getAccessToken(): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SP_API_CONFIG.refreshToken,
            client_id: SP_API_CONFIG.clientId,
            client_secret: SP_API_CONFIG.clientSecret
        })
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
    }

    const data = await response.json();
    return data.access_token;
}

// Fetch orders from SP-API (with pagination)
async function fetchOrders(accessToken: string, createdAfter: string): Promise<any[]> {
    const allOrders: any[] = [];
    let nextToken: string | null = null;
    let pageCount = 0;

    console.log(`Fetching orders created after ${createdAfter}...`);

    do {
        const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
        url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
        url.searchParams.set('CreatedAfter', createdAfter);
        url.searchParams.set('MaxResultsPerPage', '100');

        if (nextToken) {
            url.searchParams.set('NextToken', nextToken);
        }

        const headers = {
            'x-amz-access-token': accessToken,
            'x-amz-date': new Date().toISOString().replace(/[:-]|\.\\d{3}/g, ''),
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        };

        const response = await fetch(url.toString(), { headers });

        if (!response.ok) {
            const error = await response.text();
            console.error('SP-API Error Response:', error);
            throw new Error(`SP-API error: ${response.status}`);
        }

        const data = await response.json();
        const orders = data.payload?.Orders || [];
        allOrders.push(...orders);
        pageCount++;

        console.log(`   Page ${pageCount}: fetched ${orders.length} orders (total: ${allOrders.length})`);

        nextToken = data.payload?.NextToken || null;

        // Rate limiting - small delay between pages
        if (nextToken) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    } while (nextToken);

    return allOrders;
}

// Fetch order items to get ASIN
async function fetchOrderItems(accessToken: string, orderId: string): Promise<any[]> {
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;

    const headers = {
        'x-amz-access-token': accessToken,
        'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const response = await fetch(url, { headers });

    if (!response.ok) {
        console.error(`Failed to fetch items for order ${orderId}`);
        return [];
    }

    const data = await response.json();
    return data.payload?.OrderItems || [];
}

// Lookup FSN by ASIN from amazon_asin_mapping table
async function lookupFsnByAsin(asin: string): Promise<{ fsn: string; productTitle: string } | null> {
    const { data, error } = await supabase
        .from('amazon_asin_mapping')
        .select('fsn, product_title')
        .eq('asin', asin)
        .single();

    if (error || !data) {
        console.warn(`   ⚠ No FSN mapping found for ASIN: ${asin}`);
        return null;
    }

    return { fsn: data.fsn, productTitle: data.product_title };
}

// Determine fulfillment type
function getFulfillmentType(order: any): string {
    const channel = order.FulfillmentChannel;
    if (channel === 'AFN') return 'amazon_fba';  // Amazon Fulfilled Network (FBA)
    if (channel === 'MFN') return 'amazon_mfn';  // Merchant Fulfilled Network
    return 'amazon_fba'; // Default
}

// Sync orders
async function syncOrders() {
    console.log('=== Amazon SP-API Orders Sync (ASIN → FSN) ===\n');

    if (!SP_API_CONFIG.clientId || !SP_API_CONFIG.refreshToken) {
        throw new Error('Missing SP-API credentials in environment');
    }

    console.log('1. Getting access token...');
    const accessToken = await getAccessToken();
    console.log('   ✓ Access token obtained');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const createdAfter = thirtyDaysAgo.toISOString();

    console.log('\n2. Fetching orders from Amazon...');
    const orders = await fetchOrders(accessToken, createdAfter);
    console.log(`   Found ${orders.length} orders`);

    if (orders.length === 0) {
        console.log('   No orders to sync');
        return;
    }

    // Check existing orders
    console.log('\n3. Checking existing orders...');
    const orderIds = orders.map((o: any) => o.AmazonOrderId);
    const { data: existingOrders } = await supabase
        .from('amazon_orders')
        .select('order_id')
        .in('order_id', orderIds);

    const existingOrderIds = new Set((existingOrders || []).map((o: any) => o.order_id));
    const newOrders = orders.filter((o: any) => !existingOrderIds.has(o.AmazonOrderId));
    console.log(`   Existing: ${existingOrderIds.size}, New: ${newOrders.length}`);

    if (newOrders.length === 0) {
        console.log('   All orders already synced');
        return;
    }

    // Process each new order - fetch items and lookup FSN
    console.log('\n4. Processing new orders (fetching items, looking up FSN)...');
    const ordersToInsert: any[] = [];
    let processedCount = 0;
    let skippedCount = 0;

    for (const order of newOrders) {
        const orderId = order.AmazonOrderId;
        console.log(`\n   Processing order: ${orderId}`);

        // Fetch order items to get ASIN
        const items = await fetchOrderItems(accessToken, orderId);

        if (items.length === 0) {
            console.log(`   ⚠ No items found for order ${orderId}, skipping`);
            skippedCount++;
            continue;
        }

        // Process each item in the order
        for (const item of items) {
            const asin = item.ASIN;
            const sku = item.SellerSKU;

            console.log(`   - Item ASIN: ${asin}, SKU: ${sku}`);

            // Lookup FSN by ASIN
            const mapping = await lookupFsnByAsin(asin);

            if (!mapping) {
                console.log(`   ⚠ Skipping item - no FSN mapping for ASIN ${asin}`);
                continue;
            }

            console.log(`   ✓ Found FSN: ${mapping.fsn} (${mapping.productTitle})`);

            ordersToInsert.push({
                order_id: orderId,
                order_date: order.PurchaseDate,
                order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                currency: order.OrderTotal?.CurrencyCode || 'INR',
                fulfillment_type: getFulfillmentType(order),
                fsn: mapping.fsn, // FSN from ASIN lookup
                buyer_email: order.BuyerEmail || null,
                city: order.ShippingAddress?.City || null,
                state: order.ShippingAddress?.StateOrRegion || null,
                postal_code: order.ShippingAddress?.PostalCode || null,
                country: order.ShippingAddress?.CountryCode || 'IN',
                warranty_status: 'PENDING',
                synced_at: new Date().toISOString()
            });
            processedCount++;
        }

        // Rate limiting - small delay between orders
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log(`\n   Processed: ${processedCount} items, Skipped: ${skippedCount} orders`);

    if (ordersToInsert.length === 0) {
        console.log('   No valid orders to insert');
        return;
    }

    // Insert orders
    console.log('\n5. Inserting orders into database...');
    const { error } = await supabase
        .from('amazon_orders')
        .upsert(ordersToInsert, { onConflict: 'order_id' });

    if (error) {
        console.log('   Error inserting:', error.message);
    } else {
        console.log(`   ✓ Inserted/Updated ${ordersToInsert.length} orders with FSN`);
    }

    const { count } = await supabase.from('amazon_orders').select('*', { count: 'exact', head: true });
    console.log(`\nTotal orders in DB: ${count}`);
}

syncOrders().catch(console.error);
