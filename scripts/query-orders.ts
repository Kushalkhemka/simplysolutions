/**
 * Query recent FBA orders
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function queryOrders() {
    const { data, error } = await supabase
        .from('amazon_orders')
        .select('order_id, order_date, order_total, fulfillment_type, warranty_status, license_key_id, synced_at')
        .order('synced_at', { ascending: false })
        .limit(12);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Recent FBA Orders:');
    console.log('================================================================================');
    data?.forEach((order, i) => {
        console.log(`${i + 1}. Order ID: ${order.order_id}`);
        console.log(`   Date: ${order.order_date}`);
        console.log(`   Total: ₹${order.order_total || 'N/A'}`);
        console.log(`   Status: ${order.warranty_status}`);
        console.log(`   License Key ID: ${order.license_key_id || 'Not assigned'}`);
        console.log('');
    });
}

queryOrders();
