// Script to add missing second item from order 405-1833084-5542769
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const orderId = '405-1833084-5542769';

// The missing item from Amazon API
const missingItem = {
    order_id: orderId,
    fulfillment_type: 'amazon_mfn',  // Same type as existing
    fsn: 'ACROBAT-PRO-2024',  // or use SellerSKU: 1CCV-BL1Z-DF6N
    asin: 'B0GFD821W3',
    product_title: 'Acrobat Pro 2024 Full Version Software for Windows',
    quantity: 1,
    warranty_status: 'PENDING',
    synced_at: new Date().toISOString()
};

async function addMissingItem() {
    console.log('Adding missing Acrobat Pro 2024 item to order', orderId);

    // First check what FSN to use from products_data
    const { data: productData } = await supabase
        .from('products_data')
        .select('fsn, product_title')
        .ilike('product_title', '%acrobat%pro%2024%')
        .limit(5);

    console.log('\nMatching products in products_data:');
    console.log(productData);

    // Also check ASIN mappings
    const { data: asinData } = await supabase
        .from('asin_fsn_mappings')
        .select('*')
        .eq('asin', 'B0GFD821W3');

    console.log('\nASIN mapping for B0GFD821W3:');
    console.log(asinData);

    // If no ASIN mapping, we should add one
    if (!asinData || asinData.length === 0) {
        console.log('\nNo ASIN mapping found. You may need to add one first.');
    }

    // Check existing entry for this order
    const { data: existingOrders } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', orderId);

    console.log('\nExisting entries for this order:');
    existingOrders?.forEach((o, i) => {
        console.log(`  Entry ${i + 1}: FSN=${o.fsn}, Product=${o.product_title || 'N/A'}`);
    });

    // Copy buyer info from existing entry
    const existing = existingOrders?.[0];
    if (existing) {
        missingItem.buyer_email = existing.buyer_email;
        missingItem.contact_email = existing.contact_email;
        missingItem.order_date = existing.order_date;
        missingItem.city = existing.city;
        missingItem.state = existing.state;
        missingItem.postal_code = existing.postal_code;
        missingItem.country = existing.country;
    }

    console.log('\nItem to insert:');
    console.log(missingItem);

    // Insert (uncomment to actually insert)
    // const { error } = await supabase.from('amazon_orders').insert([missingItem]);
    // if (error) {
    //     console.error('Insert error:', error);
    // } else {
    //     console.log('Successfully added missing item!');
    // }
}

addMissingItem().catch(console.error);
