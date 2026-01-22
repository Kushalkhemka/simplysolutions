// Check ASIN mappings for orders with SKU-like FSN
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkMappings() {
    console.log('=== ORDERS WITH SKU-LIKE FSN ===\n');

    // Find orders where FSN looks like a SKU (starts with 1CCV)
    const { data: badOrders, error: err1 } = await supabase
        .from('amazon_orders')
        .select('order_id, fsn, asin, created_at')
        .like('fsn', '1CCV%')
        .order('created_at', { ascending: false })
        .limit(20);

    if (err1) {
        console.log('Error:', err1.message);
        return;
    }

    console.log('Orders with SKU in fsn field:', badOrders?.length || 0);

    if (badOrders && badOrders.length > 0) {
        // Get all ASIN mappings
        const { data: mappings } = await supabase
            .from('amazon_asin_mapping')
            .select('asin, fsn, product_title');

        const asinMap = new Map();
        mappings?.forEach(m => asinMap.set(m.asin, m.fsn));

        console.log('\nOrder ID | Current FSN (SKU) | ASIN | Correct FSN');
        console.log('-'.repeat(80));

        for (const order of badOrders) {
            const correctFsn = asinMap.get(order.asin) || 'NOT MAPPED!';
            console.log(`${order.order_id} | ${order.fsn} | ${order.asin || 'NULL'} | ${correctFsn}`);
        }
    }

    console.log('\n=== ALL ASIN MAPPINGS ===\n');
    const { data: allMappings } = await supabase
        .from('amazon_asin_mapping')
        .select('asin, fsn, product_title')
        .order('fsn');

    console.log(`Total mappings: ${allMappings?.length || 0}\n`);
    allMappings?.forEach(m => {
        console.log(`${m.asin} → ${m.fsn} (${m.product_title?.substring(0, 40)}...)`);
    });
}

checkMappings().catch(console.error);
