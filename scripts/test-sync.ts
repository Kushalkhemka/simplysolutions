/**
 * Sync all missing orders now
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

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

    if (!response.ok) throw new Error('Failed to get access token');
    const data = await response.json();
    return data.access_token;
}

async function fetchMFNOrders(accessToken: string, createdAfter: string): Promise<any[]> {
    const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
    url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
    url.searchParams.set('CreatedAfter', createdAfter);
    url.searchParams.set('FulfillmentChannels', 'MFN');
    url.searchParams.set('MaxResultsPerPage', '100');

    const response = await fetch(url.toString(), {
        headers: { 'x-amz-access-token': accessToken }
    });

    if (!response.ok) throw new Error(`SP-API error: ${response.status}`);
    const data = await response.json();
    return data.payload?.Orders || [];
}

async function fetchOrderItems(accessToken: string, orderId: string): Promise<any[]> {
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

async function syncAll() {
    console.log('=== Syncing All Missing Orders ===\n');

    const accessToken = await getAccessToken();

    // Fetch orders from last 7 days
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const orders = await fetchMFNOrders(accessToken, sevenDaysAgo.toISOString());

    console.log(`Found ${orders.length} orders from Amazon`);

    // Get existing orders
    const orderIds = orders.map((o: any) => o.AmazonOrderId);
    const { data: existingOrders } = await supabase
        .from('amazon_orders')
        .select('order_id')
        .in('order_id', orderIds);

    const existingSet = new Set((existingOrders || []).map((o: any) => o.order_id));
    const newOrders = orders.filter((o: any) => !existingSet.has(o.AmazonOrderId));

    console.log(`New orders to insert: ${newOrders.length}`);

    if (newOrders.length === 0) {
        console.log('\n✅ All orders already synced!');
        return;
    }

    // Fetch ASIN mapping
    const { data: asinMappings } = await supabase
        .from('amazon_asin_mapping')
        .select('asin, product_type');

    const asinToProductType = new Map<string, string>();
    (asinMappings || []).forEach((m: any) => {
        asinToProductType.set(m.asin, m.product_type);
    });

    // Prepare all orders
    const ordersToInsert = [];
    for (const order of newOrders) {
        console.log(`Processing ${order.AmazonOrderId}...`);
        const items = await fetchOrderItems(accessToken, order.AmazonOrderId);
        const firstItem = items[0];
        const asin = firstItem?.ASIN;
        const productType = asin ? asinToProductType.get(asin) : null;

        ordersToInsert.push({
            order_id: order.AmazonOrderId,
            fulfillment_type: 'amazon_mfn',
            fsn: productType || firstItem?.SellerSKU || null,
            order_date: order.PurchaseDate || null,
            order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
            currency: order.OrderTotal?.CurrencyCode || 'INR',
            quantity: firstItem?.QuantityOrdered || 1,
            buyer_email: order.BuyerInfo?.BuyerEmail || null,
            contact_email: order.BuyerInfo?.BuyerEmail || null,
            city: order.ShippingAddress?.City || null,
            state: order.ShippingAddress?.StateOrRegion || null,
            postal_code: order.ShippingAddress?.PostalCode || null,
            country: order.ShippingAddress?.CountryCode || 'IN',
            warranty_status: 'PENDING',
            synced_at: new Date().toISOString()
        });
    }

    // Insert all
    console.log(`\nInserting ${ordersToInsert.length} orders...`);
    const { error } = await supabase.from('amazon_orders').insert(ordersToInsert);

    if (error) {
        console.log('❌ INSERT ERROR:', error.message);
    } else {
        console.log('✅ All orders inserted successfully!');
        ordersToInsert.forEach(o => console.log(`  - ${o.order_id}`));
    }
}

syncAll();
