/**
 * Check order and license key availability
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const orderId = '403-4952479-4416365';

    // 1. Check amazon_orders for this order
    console.log('=== Checking Order:', orderId, '===');
    const { data: order, error: orderError } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (orderError || !order) {
        console.log('❌ Order NOT found in amazon_orders table!');
        console.log('Error:', orderError?.message);
        return;
    }

    console.log('✅ Order found:');
    console.log('   FSN:', order.fsn);
    console.log('   Fulfillment:', order.fulfillment_type);
    console.log('   License Key ID:', order.license_key_id);
    console.log('   Warranty Status:', order.warranty_status);

    // 2. Check available license keys for this FSN
    const fsn = order.fsn;
    if (!fsn) {
        console.log('\n❌ No FSN set for this order!');
        return;
    }

    console.log('\n=== Checking License Keys for FSN:', fsn, '===');

    const { data: keys, count } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact' })
        .eq('product_type', fsn)
        .eq('is_redeemed', false);

    console.log('Available (non-redeemed) keys:', count);
    if (keys && keys.length > 0) {
        console.log('Sample key:', keys[0].license_key?.substring(0, 10) + '...');
    }

    // 3. Also check all product_types in license keys
    const { data: allProductTypes } = await supabase
        .from('amazon_activation_license_keys')
        .select('product_type')
        .eq('is_redeemed', false);

    const uniqueTypes = new Set((allProductTypes || []).map(k => k.product_type));
    console.log('\n=== Available product_types with keys ===');
    console.log(Array.from(uniqueTypes).join(', '));
}

check();
