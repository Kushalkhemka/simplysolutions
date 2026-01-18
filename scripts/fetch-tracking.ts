/**
 * Fetch orders with shipment tracking IDs
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

async function fetchOrders(accessToken: string): Promise<any[]> {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('CreatedAfter', thirtyDaysAgo.toISOString());
    url.searchParams.set('OrderStatuses', 'Shipped');
    url.searchParams.set('MaxResultsPerPage', '20');

    const response = await fetch(url.toString(), {
        headers: { 'x-amz-access-token': accessToken }
    });

    const data = await response.json();
    return data.payload?.Orders || [];
}

// For FBA orders, tracking comes from order fulfillment
// For MFN orders, tracking is in order items or needs to be from Shipping API

async function run() {
    console.log('🚀 Fetching Orders with Tracking Info...\n');

    const accessToken = await getAccessToken();
    console.log('✅ Access token obtained\n');

    const orders = await fetchOrders(accessToken);
    console.log(`Found ${orders.length} shipped orders\n`);

    console.log('================================================================================');
    console.log('ORDERS WITH TRACKING:');
    console.log('================================================================================\n');

    for (const order of orders) {
        const fulfillment = order.FulfillmentChannel; // AFN = FBA, MFN = Merchant

        console.log(`📦 ${order.AmazonOrderId}`);
        console.log(`   Status: ${order.OrderStatus}`);
        console.log(`   Fulfillment: ${fulfillment === 'AFN' ? 'FBA (Amazon Fulfillment)' : 'MFN (Merchant Fulfillment)'}`);
        console.log(`   Date: ${order.PurchaseDate}`);
        console.log(`   Total: ₹${order.OrderTotal?.Amount || 'N/A'}`);
        console.log(`   Ship to: ${order.ShippingAddress?.City}, ${order.ShippingAddress?.StateOrRegion}`);

        // For FBA orders, Amazon handles tracking
        if (fulfillment === 'AFN') {
            console.log(`   📍 Tracking: Handled by Amazon FBA - check Seller Central for tracking`);
        } else {
            // For MFN, tracking should be added when you confirm shipment
            console.log(`   📍 Tracking: Check Seller Central > Manage Orders for tracking ID`);
        }

        console.log('');
    }

    console.log('\n💡 Note: Amazon SP-API Orders endpoint doesn\'t return tracking IDs directly.');
    console.log('   For FBA orders: Amazon handles all shipment tracking.');
    console.log('   For MFN orders: Tracking is added when confirming shipment in Seller Central.');
    console.log('   Use Reports API > GET_FBA_FULFILLMENT_SHIPMENT_DATA for FBA tracking details.');
}

run().catch(console.error);
