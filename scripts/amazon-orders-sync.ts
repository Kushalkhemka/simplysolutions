/**
 * Amazon SP-API Orders Sync Script (Updated - No AWS Required)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

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

// Fetch orders from SP-API
async function fetchOrders(accessToken: string, createdAfter: string): Promise<any[]> {
    const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('CreatedAfter', createdAfter);
    url.searchParams.set('MaxResultsPerPage', '100');

    console.log(`Fetching orders created after ${createdAfter}...`);
    console.log(`URL: ${url.toString()}`);

    const headers = {
        'x-amz-access-token': accessToken,
        'x-amz-date': new Date().toISOString().replace(/[:-]|\.\d{3}/g, ''),
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    };

    const response = await fetch(url.toString(), { headers });

    console.log(`Response status: ${response.status}`);

    if (!response.ok) {
        const error = await response.text();
        console.error('SP-API Error Response:', error);

        // Try to parse error for more details
        try {
            const errorJson = JSON.parse(error);
            console.error('Error details:', JSON.stringify(errorJson, null, 2));
        } catch { }

        throw new Error(`SP-API error: ${response.status}`);
    }

    const data = await response.json();
    return data.payload?.Orders || [];
}

// Sync orders
async function syncOrders() {
    console.log('=== Amazon SP-API Orders Sync ===\n');

    if (!SP_API_CONFIG.clientId || !SP_API_CONFIG.refreshToken) {
        throw new Error('Missing SP-API credentials in environment');
    }

    console.log('1. Getting access token...');
    const accessToken = await getAccessToken();
    console.log('   ✓ Access token obtained');
    console.log(`   Token preview: ${accessToken.substring(0, 30)}...`);

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

    // Check existing
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

    // Insert
    console.log('\n4. Inserting new orders...');
    const ordersToInsert = newOrders.map((o: any) => ({
        order_id: o.AmazonOrderId,
        order_date: o.PurchaseDate,
        order_total: o.OrderTotal?.Amount ? parseFloat(o.OrderTotal.Amount) : null,
        currency: o.OrderTotal?.CurrencyCode || 'INR',
        fulfillment_type: 'amazon_fba',
        buyer_email: o.BuyerEmail || null,
        city: o.ShippingAddress?.City || null,
        state: o.ShippingAddress?.StateOrRegion || null,
        postal_code: o.ShippingAddress?.PostalCode || null,
        country: o.ShippingAddress?.CountryCode || 'IN',
        warranty_status: 'PENDING',
        synced_at: new Date().toISOString()
    }));

    const { error } = await supabase.from('amazon_orders').insert(ordersToInsert);

    if (error) {
        console.log('   Error inserting:', error.message);
    } else {
        console.log(`   ✓ Inserted ${ordersToInsert.length} new orders`);
    }

    const { count } = await supabase.from('amazon_orders').select('*', { count: 'exact', head: true });
    console.log(`\nTotal orders in DB: ${count}`);
}

syncOrders().catch(console.error);
