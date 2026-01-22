// Test script to verify multi-product order logging for 405-1833084-5542769
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN,
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
    const data = await response.json();
    return data.access_token;
}

async function fetchOrderItems(accessToken, orderId) {
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

async function testMultiProductLogging() {
    console.log('=== Testing Multi-Product Order Logging ===\n');

    // Get ASIN mappings
    const { data: asinMappings } = await supabase
        .from('amazon_asin_mapping')
        .select('asin, fsn');

    const asinToFSN = new Map();
    (asinMappings || []).forEach((m) => {
        asinToFSN.set(m.asin, m.fsn);
    });

    console.log('ASIN Mappings loaded:', asinToFSN.size);

    // Fetch items from Amazon
    console.log('\nFetching order items from Amazon API...');
    const accessToken = await getAccessToken();
    const items = await fetchOrderItems(accessToken, orderId);

    console.log('\n=== Amazon Order Items ===');
    console.log('Total items:', items.length);
    items.forEach((item, i) => {
        const fsn = asinToFSN.get(item.ASIN) || item.SellerSKU;
        console.log(`\nItem ${i + 1}:`);
        console.log('  ASIN:', item.ASIN);
        console.log('  SKU:', item.SellerSKU);
        console.log('  FSN:', fsn);
        console.log('  Title:', item.Title?.substring(0, 50) + '...');
        console.log('  Quantity:', item.QuantityOrdered);
        console.log('  Price:', item.ItemPrice?.Amount);
    });

    // Simulate multi-product detection
    console.log('\n=== Multi-Product Detection ===');
    if (items.length > 1) {
        console.log('✅ DETECTED: Order has', items.length, 'products - will be logged!');

        const itemsData = items.map((item) => ({
            asin: item.ASIN,
            sku: item.SellerSKU,
            fsn: asinToFSN.get(item.ASIN) || item.SellerSKU,
            title: item.Title,
            quantity: item.QuantityOrdered,
            price: item.ItemPrice?.Amount
        }));

        const multiProductOrder = {
            order_id: orderId,
            order_date: new Date().toISOString(), // Would come from order data
            buyer_email: '85rb1t46cyprnbj@marketplace.amazon.in', // Test email
            contact_email: '85rb1t46cyprnbj@marketplace.amazon.in',
            items: itemsData,
            item_count: items.length,
            total_amount: 2855.24, // From original order
            currency: 'INR',
            fulfillment_type: 'amazon_mfn',
            status: 'PENDING'
        };

        console.log('\n=== Data to be logged ===');
        console.log(JSON.stringify(multiProductOrder, null, 2));

        // Actually insert to test
        console.log('\n=== Inserting to multi_fsn_orders ===');
        const { error, data } = await supabase
            .from('multi_fsn_orders')
            .insert([multiProductOrder])
            .select();

        if (error) {
            console.error('❌ Error:', error);
        } else {
            console.log('✅ Success! Inserted record:', data?.[0]?.id);
            console.log('\nView in admin panel: /admin/amazon/multi-fsn');
        }
    } else {
        console.log('ℹ️  Only 1 item - would sync normally, no special logging');
    }

    // Show what would be synced to amazon_orders
    console.log('\n=== First Item (synced to amazon_orders) ===');
    const firstItem = items[0];
    console.log('FSN:', asinToFSN.get(firstItem.ASIN) || firstItem.SellerSKU);
    console.log('This is what customer can activate');
}

testMultiProductLogging().catch(console.error);
