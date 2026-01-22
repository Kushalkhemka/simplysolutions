const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
    // Read listings file and build ASIN -> SKU map
    const content = fs.readFileSync('./public/assets/All+Listings+Report_01-13-2026.txt', 'utf-8');
    const lines = content.split('\n').filter(line => line.trim());

    const asinToSKU = {};
    const asinToProduct = {};
    for (let i = 1; i < lines.length; i++) {
        const columns = lines[i].split('\t');
        const productName = columns[0];
        const sku = columns[3];
        const asin = columns[16]; // asin1 column
        if (asin && sku) {
            asinToSKU[asin] = sku;
            asinToProduct[asin] = productName;
        }
    }

    console.log('=== Listings File Analysis ===');
    console.log('Total unique ASINs in listings:', Object.keys(asinToSKU).length);

    // Get amazon_asin_mapping
    const { data: mappings, error } = await supabase.from('amazon_asin_mapping').select('*');
    if (error) {
        console.log('Error:', error.message);
        return;
    }
    console.log('Total ASIN mappings in DB:', mappings.length);

    // Check which ASINs from listings are in the mapping table
    const listingsASINs = Object.keys(asinToSKU);
    const mappedASINs = mappings.map(m => m.asin);

    const inBoth = listingsASINs.filter(a => mappedASINs.includes(a));
    const onlyInListings = listingsASINs.filter(a => !mappedASINs.includes(a));

    console.log('\nASINs mapped correctly:', inBoth.length);
    console.log('ASINs MISSING from mapping table:', onlyInListings.length);

    if (onlyInListings.length > 0) {
        console.log('\n=== Products WITHOUT ASIN->FSN mapping ===');
        onlyInListings.forEach(asin => {
            const name = asinToProduct[asin] || '';
            console.log('ASIN:', asin);
            console.log('  SKU:', asinToSKU[asin]);
            console.log('  Product:', name.substring(0, 80) + '...');
            console.log('');
        });
    }
}

analyze().catch(console.error);
