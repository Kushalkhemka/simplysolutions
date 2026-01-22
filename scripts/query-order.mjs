import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function queryOrder() {
    // Get all entries for this order_id
    const { data: orders, error: ordersError } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', '405-1833084-5542769')
        .order('created_at', { ascending: true });

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    console.log('\n=== AMAZON_ORDERS ===');
    console.log('Found', orders?.length, 'entries');
    orders?.forEach((order, i) => {
        console.log(`\nEntry ${i + 1}:`);
        console.log('  ID:', order.id);
        console.log('  FSN:', order.fsn);
        console.log('  Product:', order.product_title);
        console.log('  Fulfillment:', order.fulfillment_type);
        console.log('  License Key ID:', order.license_key_id);
    });

    // Get all license keys for this order
    const { data: keys, error: keysError } = await supabase
        .from('amazon_activation_license_keys')
        .select('*')
        .eq('order_id', '405-1833084-5542769')
        .order('created_at', { ascending: true });

    if (keysError) {
        console.error('Error fetching keys:', keysError);
        return;
    }

    console.log('\n=== LICENSE KEYS ===');
    console.log('Found', keys?.length, 'keys');
    keys?.forEach((key, i) => {
        console.log(`\nKey ${i + 1}:`);
        console.log('  ID:', key.id);
        console.log('  FSN:', key.fsn);
        console.log('  License Key:', key.license_key);
        console.log('  Is Redeemed:', key.is_redeemed);
    });
}

queryOrder();
