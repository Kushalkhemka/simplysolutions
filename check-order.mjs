import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(url, key);

async function checkOrder() {
    const orderId = '406-1346637-5384351';

    console.log('=== Checking Product Requests ===');
    const { data: requests, error: reqError } = await supabase
        .from('product_requests')
        .select('*')
        .eq('order_id', orderId);

    if (reqError) console.error('Error:', reqError);
    else console.log(JSON.stringify(requests, null, 2));

    console.log('\n=== Checking Office365 Requests ===');
    const { data: o365, error: o365Error } = await supabase
        .from('office365_requests')
        .select('*')
        .eq('order_id', orderId);

    if (o365Error) console.error('Error:', o365Error);
    else console.log(JSON.stringify(o365, null, 2));

    console.log('\n=== Checking Amazon Orders ===');
    const { data: orders, error: orderError } = await supabase
        .from('amazon_orders')
        .select('order_id, fsn, product_name, quantity')
        .eq('order_id', orderId);

    if (orderError) console.error('Error:', orderError);
    else console.log(JSON.stringify(orders, null, 2));
}

checkOrder();
