const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSKUs() {
    // Read the listings file
    const content = fs.readFileSync('./public/assets/All+Listings+Report_01-13-2026.txt', 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    // Skip header row, extract SKUs from column 4 (seller-sku)
    const skus = [];
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split('\t');
        if (columns[3]) {
            skus.push(columns[3].trim());
        }
    }

    console.log(`Total SKUs in file: ${skus.length}`);
    console.log(`Sample SKUs: ${skus.slice(0, 5).join(', ')}`);

    // Check how many exist in amazon_orders (check fsn column)
    const { data: ordersByFSN, error: fsnError } = await supabase
        .from('amazon_orders')
        .select('fsn')
        .in('fsn', skus);

    if (fsnError) {
        console.error('Error querying by FSN:', fsnError.message);
    } else {
        const uniqueFSNs = new Set(ordersByFSN?.map(o => o.fsn));
        console.log(`\nSKUs found in amazon_orders.fsn: ${uniqueFSNs.size}`);
        if (uniqueFSNs.size > 0) {
            console.log(`Matching FSNs: ${Array.from(uniqueFSNs).slice(0, 10).join(', ')}`);
        }
    }

    // Get all unique FSNs from amazon_orders to compare
    const { data: allFSNs, error: allError } = await supabase
        .from('amazon_orders')
        .select('fsn')
        .not('fsn', 'is', null);

    if (!allError && allFSNs) {
        const uniqueOrderFSNs = new Set(allFSNs.map(o => o.fsn));
        console.log(`\nTotal unique FSNs in amazon_orders: ${uniqueOrderFSNs.size}`);
        console.log(`Sample FSNs from orders: ${Array.from(uniqueOrderFSNs).slice(0, 5).join(', ')}`);

        // Check which SKUs from file match FSNs in orders
        const matchingSKUs = skus.filter(sku => uniqueOrderFSNs.has(sku));
        console.log(`\nSKUs from file that exist in amazon_orders: ${matchingSKUs.length}`);
        if (matchingSKUs.length > 0) {
            console.log(`Matching SKUs: ${matchingSKUs.join(', ')}`);
        }

        // Show SKUs NOT in amazon_orders
        const missingSKUs = skus.filter(sku => !uniqueOrderFSNs.has(sku));
        console.log(`\nSKUs from file NOT in amazon_orders: ${missingSKUs.length}`);
        if (missingSKUs.length > 0 && missingSKUs.length <= 20) {
            console.log(`Missing SKUs: ${missingSKUs.join(', ')}`);
        }
    }
}

checkSKUs().catch(console.error);
