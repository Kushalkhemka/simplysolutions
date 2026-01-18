/**
 * Fetch ALL order details from Amazon SP-API with maximum fields
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    merchantToken: process.env.AMAZON_SP_MERCHANT_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

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

    const data = await response.json();
    return data.access_token;
}

async function fetchOrdersWithDetails(accessToken: string): Promise<any[]> {
    // Fetch orders from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('CreatedAfter', thirtyDaysAgo.toISOString());
    url.searchParams.set('MaxResultsPerPage', '100');

    console.log('Fetching orders...');

    const response = await fetch(url.toString(), {
        headers: {
            'x-amz-access-token': accessToken,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        const error = await response.text();
        console.error('Error:', error);
        throw new Error(`SP-API error: ${response.status}`);
    }

    const data = await response.json();
    return data.payload?.Orders || [];
}

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

async function run() {
    console.log('🚀 Amazon SP-API - Full Order Details Fetcher');
    console.log('================================================================================\n');

    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    const orders = await fetchOrdersWithDetails(accessToken);
    console.log(`✅ Found ${orders.length} orders\n`);

    console.log('================================================================================');
    console.log('FULL ORDER DETAILS (All Fields):');
    console.log('================================================================================\n');

    for (const order of orders) {
        console.log('─'.repeat(80));
        console.log(`📦 ORDER: ${order.AmazonOrderId}`);
        console.log('─'.repeat(80));

        // Print ALL order fields
        console.log('\n📋 ORDER METADATA:');
        Object.entries(order).forEach(([key, value]) => {
            if (typeof value === 'object' && value !== null) {
                console.log(`   ${key}: ${JSON.stringify(value)}`);
            } else {
                console.log(`   ${key}: ${value}`);
            }
        });

        // Fetch order items
        console.log('\n📦 ORDER ITEMS:');
        const items = await fetchOrderItems(accessToken, order.AmazonOrderId);

        if (items.length > 0) {
            items.forEach((item, i) => {
                console.log(`\n   Item ${i + 1}:`);
                Object.entries(item).forEach(([key, value]) => {
                    if (typeof value === 'object' && value !== null) {
                        console.log(`      ${key}: ${JSON.stringify(value)}`);
                    } else {
                        console.log(`      ${key}: ${value}`);
                    }
                });
            });
        } else {
            console.log('   (No items found or access denied)');
        }

        console.log('\n');
    }
}

run().catch(console.error);
