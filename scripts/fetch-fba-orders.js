require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fetchOrders() {
    const { data, error } = await supabase
        .from('amazon_orders')
        .select('order_id, state, fulfillment_status, fulfillment_type, order_date, created_at')
        .eq('fulfillment_type', 'amazon_fba');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total FBA orders:', data.length);

    // Group by state
    const stateCount = {};
    data.forEach(order => {
        const state = order.state || 'NULL';
        stateCount[state] = (stateCount[state] || 0) + 1;
    });

    console.log('\nStates found:');
    Object.entries(stateCount)
        .sort((a, b) => b[1] - a[1])
        .forEach(([state, count]) => console.log(`  ${state}: ${count}`));

    // Show a few sample orders with their states for verification
    console.log('\nSample recent FBA orders:');
    data.slice(0, 10).forEach(order => {
        console.log(`  ${order.order_id} | State: ${order.state || 'NULL'} | Status: ${order.fulfillment_status} | Date: ${order.order_date}`);
    });
}

fetchOrders();
