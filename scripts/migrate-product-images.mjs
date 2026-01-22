#!/usr/bin/env node

/**
 * Script to migrate product images from old Supabase bucket to new bucket
 * Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/migrate-product-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import https from 'https';
import http from 'http';
import path from 'path';

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://api.simplysolutions.co.in';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Old bucket URL patterns to migrate
const OLD_BUCKET_PATTERNS = [
    'supabase-supabase2.exxngc.easypanel.host',
    'qcsdnlakugvnwlflhwpo.supabase.co'
];

// Download image from URL
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;

        const options = {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        };

        const request = protocol.get(url, options, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                downloadImage(response.headers.location).then(resolve).catch(reject);
                return;
            }

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve({
                buffer: Buffer.concat(chunks),
                contentType: response.headers['content-type'] || 'image/png'
            }));
            response.on('error', reject);
        });

        request.on('error', reject);
        request.setTimeout(30000, () => {
            request.destroy();
            reject(new Error('Timeout'));
        });
    });
}

// Upload to Supabase storage
async function uploadToSupabase(buffer, filename, contentType) {
    const { data, error } = await supabase.storage
        .from('product-assets')
        .upload(`product-images/${filename}`, buffer, {
            contentType,
            upsert: true,
        });

    if (error) {
        console.error(`  Error uploading ${filename}:`, error.message);
        return null;
    }

    const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(`product-images/${filename}`);

    return urlData.publicUrl;
}

// Get filename from URL
function getFilenameFromUrl(url, fsn) {
    const urlPath = new URL(url).pathname;
    const originalName = path.basename(urlPath);
    const ext = path.extname(originalName) || '.png';
    // Use FSN as filename for better organization
    return `${fsn}${ext}`;
}

// Check if URL is from old bucket
function isOldBucketUrl(url) {
    if (!url) return false;
    return OLD_BUCKET_PATTERNS.some(pattern => url.includes(pattern));
}

// Main function
async function main() {
    console.log('=== Product Image Migration ===\n');
    console.log(`Supabase URL: ${SUPABASE_URL}\n`);

    // Fetch all products with images
    const { data: products, error } = await supabase
        .from('products_data')
        .select('id, fsn, product_title, product_image, original_image_url')
        .not('product_image', 'is', null);

    if (error) {
        console.error('Error fetching products:', error.message);
        return;
    }

    console.log(`Found ${products.length} products with images\n`);

    // Filter products with old bucket URLs
    const productsToMigrate = products.filter(p => isOldBucketUrl(p.product_image));
    console.log(`${productsToMigrate.length} products need migration\n`);

    let migrated = 0;
    let failed = 0;
    const updates = [];

    for (const product of productsToMigrate) {
        console.log(`\nProcessing: ${product.fsn}`);
        console.log(`  Title: ${product.product_title?.substring(0, 50)}...`);
        console.log(`  Old URL: ${product.product_image}`);

        // Try original_image_url first (external source like Amazon), then product_image
        let sourceUrl = product.original_image_url || product.product_image;

        // Fix protocol-relative URLs (starting with //)
        if (sourceUrl && sourceUrl.startsWith('//')) {
            sourceUrl = 'https:' + sourceUrl;
        }

        console.log(`  Source URL: ${sourceUrl}`);

        try {
            const { buffer, contentType } = await downloadImage(sourceUrl);
            const filename = getFilenameFromUrl(sourceUrl, product.fsn);
            const newUrl = await uploadToSupabase(buffer, filename, contentType);

            if (newUrl) {
                console.log(`  ✓ Uploaded: ${newUrl}`);
                updates.push({ id: product.id, fsn: product.fsn, newUrl });
                migrated++;
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`  ✗ Failed to download: ${err.message}`);

            // Try product_image if original_image failed
            if (product.original_image && product.product_image !== product.original_image) {
                console.log(`  Trying product_image...`);
                try {
                    const { buffer, contentType } = await downloadImage(product.product_image);
                    const filename = getFilenameFromUrl(product.product_image, product.fsn);
                    const newUrl = await uploadToSupabase(buffer, filename, contentType);

                    if (newUrl) {
                        console.log(`  ✓ Uploaded: ${newUrl}`);
                        updates.push({ id: product.id, fsn: product.fsn, newUrl });
                        migrated++;
                        continue;
                    }
                } catch (e) {
                    console.error(`  ✗ Both sources failed`);
                }
            }
            failed++;
        }
    }

    console.log(`\n=== Migration Summary ===`);
    console.log(`Migrated: ${migrated}`);
    console.log(`Failed: ${failed}`);

    if (updates.length > 0) {
        console.log(`\n=== Updating Database ===\n`);

        for (const update of updates) {
            const { error } = await supabase
                .from('products_data')
                .update({ product_image: update.newUrl })
                .eq('id', update.id);

            if (error) {
                console.error(`Failed to update ${update.fsn}: ${error.message}`);
            } else {
                console.log(`Updated: ${update.fsn}`);
            }
        }

        console.log('\n✓ Database updated with new image URLs.');
    }

    // List products that still need manual fix
    if (failed > 0) {
        console.log('\n=== Products Needing Manual Fix ===');
        const failedProducts = productsToMigrate.filter(p =>
            !updates.some(u => u.id === p.id)
        );
        for (const p of failedProducts) {
            console.log(`- ${p.fsn}: ${p.product_title?.substring(0, 40)}`);
        }
    }
}

main().catch(console.error);
