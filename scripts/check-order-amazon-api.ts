/**
 * Direct Amazon SP-API query to get all available details for a specific order
 */

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

async function getAccessToken(): Promise<string> {
    console.log('🔑 Getting access token...');
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
    console.log('✅ Access token obtained\n');
    return data.access_token;
}

async function getOrderDetails(accessToken: string, orderId: string) {
    console.log(`📦 Fetching order details for: ${orderId}\n`);

    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get order: ${error}`);
    }

    return await response.json();
}

async function getOrderItems(accessToken: string, orderId: string) {
    console.log(`📋 Fetching order items...\n`);

    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get order items: ${error}`);
    }

    return await response.json();
}

async function main() {
    const orderId = process.argv[2] || '405-9579211-0175508';

    console.log('='.repeat(60));
    console.log('🔍 AMAZON SP-API ORDER LOOKUP');
    console.log('='.repeat(60));
    console.log(`\nOrder ID: ${orderId}\n`);

    try {
        const accessToken = await getAccessToken();

        // 1. Get main order details
        const orderData = await getOrderDetails(accessToken, orderId);
        console.log('─'.repeat(60));
        console.log('📦 ORDER DETAILS (from getOrder endpoint):');
        console.log('─'.repeat(60));
        console.log(JSON.stringify(orderData, null, 2));

        // 2. Get order items
        const itemsData = await getOrderItems(accessToken, orderId);
        console.log('\n' + '─'.repeat(60));
        console.log('📋 ORDER ITEMS (from getOrderItems endpoint):');
        console.log('─'.repeat(60));
        console.log(JSON.stringify(itemsData, null, 2));

        // Key fields for fraud prevention
        const order = orderData.payload;
        if (order) {
            console.log('\n' + '='.repeat(60));
            console.log('🎯 KEY FIELDS FOR FRAUD PREVENTION:');
            console.log('='.repeat(60));
            console.log(`   OrderStatus: ${order.OrderStatus}`);
            console.log(`   FulfillmentChannel: ${order.FulfillmentChannel}`);
            console.log(`   ShippingAddress: ${JSON.stringify(order.ShippingAddress)}`);
            console.log(`   NumberOfItemsShipped: ${order.NumberOfItemsShipped}`);
            console.log(`   NumberOfItemsUnshipped: ${order.NumberOfItemsUnshipped}`);
        }

    } catch (error: any) {
        console.error('\n❌ Error:', error.message);
    }
}

main();
