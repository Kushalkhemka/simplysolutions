// Query Amazon SP-API directly for order items
import 'dotenv/config';

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

const orderId = '405-1833084-5542769';

async function getAccessToken() {
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
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchOrderItems(accessToken, orderId) {
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    if (!response.ok) {
        console.error('Error:', response.status, response.statusText);
        return [];
    }
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

async function main() {
    console.log('Fetching Amazon access token...');
    const accessToken = await getAccessToken();
    console.log('Got access token, fetching order items...');

    const items = await fetchOrderItems(accessToken, orderId);

    console.log('\n=== AMAZON ORDER ITEMS ===');
    console.log('Order ID:', orderId);
    console.log('Total Items:', items.length);

    items.forEach((item, i) => {
        console.log(`\n--- Item ${i + 1} ---`);
        console.log('  ASIN:', item.ASIN);
        console.log('  SellerSKU:', item.SellerSKU);
        console.log('  Title:', item.Title);
        console.log('  Quantity:', item.QuantityOrdered);
        console.log('  Price:', item.ItemPrice?.Amount, item.ItemPrice?.CurrencyCode);
    });
}

main().catch(console.error);
