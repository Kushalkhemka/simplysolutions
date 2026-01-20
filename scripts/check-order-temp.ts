/**
 * Check order in database
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function check() {
    const orderId = '402-0916678-4671556';

    console.log('Checking Order:', orderId);
    const { data: order, error } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId);

    if (error) {
        console.log('Error:', error.message);
        return;
    }

    if (!order || order.length === 0) {
        console.log('❌ NOT found in database');
        return;
    }

    console.log('✅ Order found:');
    console.log(JSON.stringify(order[0], null, 2));
}

check();
