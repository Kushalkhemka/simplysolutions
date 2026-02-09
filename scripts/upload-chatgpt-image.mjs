#!/usr/bin/env node

/**
 * Script to upload ChatGPT product image to Supabase storage
 * and update products_data table
 * 
 * Run with: node scripts/upload-chatgpt-image.mjs <path-to-image>
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://api.simplysolutions.co.in';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    console.error('Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-chatgpt-image.mjs <path-to-image>');
    process.exit(1);
}

const imagePath = process.argv[2];
if (!imagePath) {
    console.error('Error: Image path is required');
    console.error('Usage: node scripts/upload-chatgpt-image.mjs <path-to-image>');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('=== ChatGPT Product Image Upload ===\n');

    // Read image file
    console.log(`Reading image from: ${imagePath}`);
    const imageBuffer = fs.readFileSync(imagePath);
    const ext = path.extname(imagePath) || '.png';
    const filename = `chatgpt${ext}`;

    // Upload to Supabase storage
    console.log(`Uploading to product-assets/product-images/${filename}...`);

    const { data: uploadData, error: uploadError } = await supabase.storage
        .from('product-assets')
        .upload(`product-images/${filename}`, imageBuffer, {
            contentType: `image/${ext.replace('.', '')}`,
            upsert: true,
        });

    if (uploadError) {
        console.error('Upload error:', uploadError.message);
        process.exit(1);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(`product-images/${filename}`);

    const publicUrl = urlData.publicUrl;
    console.log(`✓ Uploaded successfully!`);
    console.log(`  Public URL: ${publicUrl}\n`);

    // Update products_data table
    console.log('Updating products_data table...');

    // First check if the row exists
    const { data: existingRow, error: selectError } = await supabase
        .from('products_data')
        .select('id, fsn, product_title')
        .eq('fsn', 'chatgpt')
        .single();

    if (selectError && selectError.code !== 'PGRST116') {
        console.error('Error checking existing row:', selectError.message);
    }

    if (existingRow) {
        // Update existing row
        const { error: updateError } = await supabase
            .from('products_data')
            .update({
                product_image: publicUrl,
                installation_doc: 'chatgpt',
                slug: 'chatgpt'
            })
            .eq('fsn', 'chatgpt');

        if (updateError) {
            console.error('Update error:', updateError.message);
            process.exit(1);
        }
        console.log(`✓ Updated existing row (FSN: chatgpt)`);
    } else {
        // Insert new row
        const { error: insertError } = await supabase
            .from('products_data')
            .insert({
                fsn: 'chatgpt',
                product_title: 'ChatGPT Plus 12 Months Subscription',
                product_image: publicUrl,
                installation_doc: 'chatgpt',
                slug: 'chatgpt'
            });

        if (insertError) {
            console.error('Insert error:', insertError.message);
            process.exit(1);
        }
        console.log(`✓ Inserted new row (FSN: chatgpt)`);
    }

    console.log('\n=== Done! ===');
    console.log(`Product image URL: ${publicUrl}`);
    console.log('Installation doc: chatgpt');
}

main().catch(console.error);
