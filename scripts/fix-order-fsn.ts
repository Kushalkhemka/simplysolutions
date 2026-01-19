/**
 * Fix existing orders - update fsn from SellerSKU to product_type using ASIN mapping
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
    const data = await response.json();
    return data.access_token;
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

async function fix() {
    console.log('=== Fixing FSN for existing orders ===\n');

    // Get access token
    const accessToken = await getAccessToken();
    console.log('✅ Got access token\n');

    // Load ASIN mapping
    const { data: mappings } = await supabase
        .from('amazon_asin_mapping')
        .select('asin, product_type');

    const asinToProductType = new Map<string, string>();
    (mappings || []).forEach(m => asinToProductType.set(m.asin, m.product_type));
    console.log(`✅ Loaded ${mappings?.length} ASIN mappings\n`);

    // Get orders that have wrong FSN (looks like SKU pattern)
    const { data: orders } = await supabase
        .from('amazon_orders')
        .select('order_id, fsn')
        .like('order_id', '4%-%-%');  // Amazon order ID pattern

    console.log(`Found ${orders?.length} orders to check\n`);

    let fixed = 0;
    for (const order of orders || []) {
        // Fetch order items from Amazon to get ASIN
        const items = await fetchOrderItems(accessToken, order.order_id);
        const asin = items[0]?.ASIN;

        if (asin) {
            const productType = asinToProductType.get(asin);
            if (productType && productType !== order.fsn) {
                console.log(`Order ${order.order_id}: ASIN=${asin} → ${productType}`);

                // Update order with correct product_type
                await supabase
                    .from('amazon_orders')
                    .update({ fsn: productType })
                    .eq('order_id', order.order_id);

                fixed++;
            }
        }
    }

    console.log(`\n✅ Fixed ${fixed} orders`);
}

fix().catch(console.error);
