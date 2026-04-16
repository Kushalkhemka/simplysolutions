/**
 * Query all orders linked to a specific base license key
 * Run with: npx tsx scripts/query-base-key-orders.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BASE_KEY = 'Y2V7F-H9KV4-MGJ7T-687GD';

async function queryOrdersByBaseKey() {
    console.log(`\n🔍 Searching for orders with base license key: ${BASE_KEY}\n`);

    // Step 1: Find all license keys that start with this base key
    const { data: keys, error: keysError } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, is_redeemed, order_id, fsn')
        .ilike('license_key', BASE_KEY + '%');

    if (keysError) {
        console.error('Error fetching keys:', keysError);
        return;
    }

    console.log(`📋 Found ${keys?.length || 0} license key(s) matching base key "${BASE_KEY}"`);

    if (!keys || keys.length === 0) {
        console.log('No license keys found.');
        return;
    }

    // Show all matching keys
    console.log('\n  License Keys:');
    keys.forEach((k, i) => {
        console.log(`    ${i + 1}. ${k.license_key} | FSN: ${k.fsn || 'N/A'} | Redeemed: ${k.is_redeemed ? 'Yes' : 'No'} | Order: ${k.order_id || 'N/A'}`);
    });

    // Step 2: Get list of key IDs
    const keyIds = keys.map(k => k.id);

    // Step 3: Find all orders linked to these license keys
    const { data: orders, error: ordersError, count } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact' })
        .in('license_key_id', keyIds);

    if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        return;
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`  ORDERS WITH BASE LICENSE KEY: ${BASE_KEY}`);
    console.log('═'.repeat(80));
    console.log(`\n  📊 Total Order Count: ${count}\n`);

    if (orders && orders.length > 0) {
        console.log('  ORDER DETAILS:');
        console.log('  ' + '-'.repeat(76));
        orders.forEach((order, i) => {
            const date = new Date(order.created_at).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
            });
            console.log(`  ${i + 1}. Order ID: ${order.order_id}`);
            console.log(`     FSN: ${order.fsn || 'N/A'} | Type: ${order.fulfillment_type || 'N/A'} | Warranty: ${order.warranty_status}`);
            console.log(`     Email: ${order.contact_email || 'N/A'} | Phone: ${order.contact_phone || 'N/A'}`);
            console.log(`     Created: ${date}`);
            console.log('');
        });
    } else {
        console.log('  No orders found linked to these license keys.');
    }

    // Also check if any orders reference these keys via order_id field in license_keys table
    const orderIdsFromKeys = keys.filter(k => k.order_id).map(k => k.order_id);
    if (orderIdsFromKeys.length > 0) {
        const { data: ordersByOrderId, error: ordersByIdError, count: countById } = await supabase
            .from('amazon_orders')
            .select('*', { count: 'exact' })
            .in('order_id', orderIdsFromKeys)
            .not('license_key_id', 'in', `(${keyIds.join(',')})`);  // Exclude already found ones

        if (!ordersByIdError && ordersByOrderId && ordersByOrderId.length > 0) {
            console.log(`  📌 Additional orders found via order_id reference: ${countById}`);
            ordersByOrderId.forEach((order, i) => {
                console.log(`  ${i + 1}. Order ID: ${order.order_id} | FSN: ${order.fsn || 'N/A'} | Warranty: ${order.warranty_status}`);
            });
        }
    }

    console.log('═'.repeat(80));
}

queryOrdersByBaseKey();
