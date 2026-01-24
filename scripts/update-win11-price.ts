// Script to update Windows 11 Pro product price to ₹499
// Run with: npx tsx scripts/update-win11-price.ts

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables. Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updatePrice() {
    const productSlug = 'windows-11-pro-product-license-key-1-userpc-lifetime-validity-3264-bit-or-unlimited-reinstallations--off_17';
    const newPrice = 499;

    console.log(`Updating price for product: ${productSlug}`);
    console.log(`New price: ₹${newPrice}`);

    // First, check if the product exists
    const { data: product, error: fetchError } = await supabase
        .from('products')
        .select('id, name, price, mrp, slug')
        .eq('slug', productSlug)
        .single();

    if (fetchError) {
        console.error('Error fetching product:', fetchError);
        return;
    }

    if (!product) {
        console.error('Product not found!');
        return;
    }

    console.log('\nCurrent product details:');
    console.log(`  Name: ${product.name}`);
    console.log(`  Current Price: ₹${product.price}`);
    console.log(`  MRP: ₹${product.mrp}`);

    // Update the price
    const { data: updated, error: updateError } = await supabase
        .from('products')
        .update({ price: newPrice })
        .eq('id', product.id)
        .select('id, name, price, mrp')
        .single();

    if (updateError) {
        console.error('Error updating price:', updateError);
        return;
    }

    console.log('\n✅ Price updated successfully!');
    console.log(`  New Price: ₹${updated.price}`);
    console.log(`  Savings: ₹${updated.mrp - updated.price} (${Math.round(((updated.mrp - updated.price) / updated.mrp) * 100)}% off)`);
}

updatePrice().catch(console.error);
