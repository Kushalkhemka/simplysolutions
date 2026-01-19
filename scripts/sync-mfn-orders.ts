/**
 * Sync MFN (Merchant Fulfilled) Orders from Amazon SP-API
 * Runs every 15 minutes via cron
 */

import { createClient } from '@supabase/supabase-js';

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    merchantToken: process.env.AMAZON_SP_MERCHANT_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

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

// Fetch MFN orders from SP-API
async function fetchMFNOrders(accessToken: string, createdAfter: string): Promise<any[]> {
    const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('CreatedAfter', createdAfter);
    url.searchParams.set('FulfillmentChannels', 'MFN'); // Merchant Fulfilled only
    url.searchParams.set('MaxResultsPerPage', '100');

    const response = await fetch(url.toString(), {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`SP-API error: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.payload?.Orders || [];
}

// Get order items for additional details (ASIN, SKU)
async function fetchOrderItems(accessToken: string, orderId: string): Promise<any[]> {
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;

    const response = await fetch(url, {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        return [];
    }

    const data = await response.json();
    return data.payload?.OrderItems || [];
}

export interface SyncResult {
    success: boolean;
    ordersFound: number;
    ordersInserted: number;
    ordersSkipped: number;
    errors: string[];
}

// Main sync function
export async function syncMFNOrders(): Promise<SyncResult> {
    const result: SyncResult = {
        success: false,
        ordersFound: 0,
        ordersInserted: 0,
        ordersSkipped: 0,
        errors: []
    };

    try {
        // Validate config
        if (!SP_API_CONFIG.clientId || !SP_API_CONFIG.refreshToken) {
            result.errors.push('Missing SP-API credentials');
            return result;
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            result.errors.push('Missing Supabase credentials');
            return result;
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get access token
        const accessToken = await getAccessToken();

        // Fetch orders from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const createdAfter = sevenDaysAgo.toISOString();

        const orders = await fetchMFNOrders(accessToken, createdAfter);
        result.ordersFound = orders.length;

        if (orders.length === 0) {
            result.success = true;
            return result;
        }

        // Check existing orders
        const orderIds = orders.map((o: any) => o.AmazonOrderId);
        const { data: existingOrders } = await supabase
            .from('amazon_orders')
            .select('order_id')
            .in('order_id', orderIds);

        const existingOrderIds = new Set((existingOrders || []).map((o: any) => o.order_id));
        const newOrders = orders.filter((o: any) => !existingOrderIds.has(o.AmazonOrderId));
        result.ordersSkipped = existingOrderIds.size;

        if (newOrders.length === 0) {
            result.success = true;
            return result;
        }

        // Prepare orders with ASIN lookup
        const ordersToInsert = [];
        for (const order of newOrders) {
            // Get first item's ASIN
            const items = await fetchOrderItems(accessToken, order.AmazonOrderId);
            const firstItem = items[0];

            ordersToInsert.push({
                order_id: order.AmazonOrderId,
                order_date: order.PurchaseDate,
                order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                currency: order.OrderTotal?.CurrencyCode || 'INR',
                fulfillment_type: 'amazon_mfn',
                buyer_email: order.BuyerInfo?.BuyerEmail || null,
                city: order.ShippingAddress?.City || null,
                state: order.ShippingAddress?.StateOrRegion || null,
                postal_code: order.ShippingAddress?.PostalCode || null,
                country: order.ShippingAddress?.CountryCode || 'IN',
                asin: firstItem?.ASIN || null,
                sku: firstItem?.SellerSKU || null,
                product_title: firstItem?.Title?.substring(0, 255) || null,
                warranty_status: 'PENDING',
                synced_at: new Date().toISOString()
            });
        }

        // Insert orders
        const { error } = await supabase.from('amazon_orders').insert(ordersToInsert);

        if (error) {
            result.errors.push(`Insert error: ${error.message}`);
            return result;
        }

        result.ordersInserted = ordersToInsert.length;
        result.success = true;
        return result;

    } catch (error: any) {
        result.errors.push(error.message || 'Unknown error');
        return result;
    }
}

// CLI execution
if (require.main === module) {
    require('dotenv').config({ path: '.env.local' });

    console.log('=== MFN Orders Sync ===\n');

    syncMFNOrders().then(result => {
        console.log('Result:', JSON.stringify(result, null, 2));
        process.exit(result.success ? 0 : 1);
    });
}
