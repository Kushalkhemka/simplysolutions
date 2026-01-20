#!/usr/bin/env node

/**
 * Script to download product images and upload them to Supabase storage
 * Run with: node scripts/upload-bundle-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Supabase config - update these with your values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcsdnlakugvnwlflhwpo.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Bundle product images mapping
const bundleImages = {
    'ultimate-productivity-bundle': [
        { name: 'win11-pro', url: 'https://m.media-amazon.com/images/I/71LYJBkyswL.jpg' },
        { name: 'office-2024', url: 'https://m.media-amazon.com/images/I/71pdlXzot7L.jpg' },
    ],
    'professional-suite-bundle': [
        { name: 'win10-11-pro', url: 'https://m.media-amazon.com/images/I/71EtzQMgeeL.jpg' },
        { name: 'office-2021', url: 'https://m.media-amazon.com/images/I/61a6d2+V3YL.jpg' },
    ],
    'home-office-starter-bundle': [
        { name: 'win10-11-home', url: 'https://m.media-amazon.com/images/I/71rJ0m7YA9L.jpg' },
        { name: 'office-2019', url: 'https://m.media-amazon.com/images/I/71Y5gsruGtL.jpg' },
    ],
    'microsoft-365-complete': [
        { name: 'm365-pro', url: 'https://m.media-amazon.com/images/I/712WD33wRQL.jpg' },
        { name: 'win11-pro', url: 'https://m.media-amazon.com/images/I/71LYJBkyswL.jpg' },
    ],
    'enterprise-cloud-bundle': [
        { name: 'm365-enterprise', url: 'https://m.media-amazon.com/images/I/71D-5hSNjOL.jpg' },
        { name: 'win-enterprise', url: 'https://m.media-amazon.com/images/I/71uS9bRwFIL.jpg' },
    ],
    'creative-pro-bundle': [
        { name: 'canva-pro', url: 'https://m.media-amazon.com/images/I/81O5EvobQ4L.jpg' },
    ],
    'designer-complete-bundle': [
        { name: 'office-2024', url: 'https://m.media-amazon.com/images/I/71pdlXzot7L.jpg' },
    ],
    'project-manager-bundle': [
        { name: 'office-2021', url: 'https://m.media-amazon.com/images/I/61a6d2+V3YL.jpg' },
    ],
    'complete-pm-suite': [
        { name: 'office-2021', url: 'https://m.media-amazon.com/images/I/61t8xq6rZaL.jpg' },
    ],
    'mac-productivity-bundle': [
        { name: 'office-mac-2024', url: 'https://m.media-amazon.com/images/I/81Vq8qzAnyL.jpg' },
        { name: 'canva-pro', url: 'https://m.media-amazon.com/images/I/81O5EvobQ4L.jpg' },
    ],
    'mac-complete-office': [
        { name: 'office-mac-2024', url: 'https://m.media-amazon.com/images/I/717wGzu8yoL.jpg' },
    ],
    'ai-power-user-bundle': [
        { name: 'm365-copilot', url: 'https://m.media-amazon.com/images/I/712WD33wRQL.jpg' },
    ],
    'budget-office-bundle': [
        { name: 'win10-pro', url: 'https://m.media-amazon.com/images/I/51HUBoX4j-L.jpg' },
        { name: 'office-2016', url: 'https://m.media-amazon.com/images/I/61A615zrbdL.jpg' },
    ],
    'cad-master-bundle': [
        { name: 'win11-pro', url: 'https://m.media-amazon.com/images/I/71LYJBkyswL.jpg' },
    ],
    'all-in-one-business-bundle': [
        { name: 'combo', url: 'https://m.media-amazon.com/images/I/81b+BbN70uL.jpg' },
    ],
};

// Download image from URL
async function downloadImage(url) {
    return new Promise((resolve, reject) => {
        const protocol = url.startsWith('https') ? https : http;
        protocol.get(url, (response) => {
            if (response.statusCode === 301 || response.statusCode === 302) {
                // Follow redirect
                downloadImage(response.headers.location).then(resolve).catch(reject);
                return;
            }

            const chunks = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', reject);
        }).on('error', reject);
    });
}

// Upload to Supabase storage
async function uploadToSupabase(buffer, filename) {
    const { data, error } = await supabase.storage
        .from('product-assets')
        .upload(`bundles/${filename}`, buffer, {
            contentType: 'image/jpeg',
            upsert: true, // Overwrite if exists
        });

    if (error) {
        console.error(`Error uploading ${filename}:`, error.message);
        return null;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(`bundles/${filename}`);

    return urlData.publicUrl;
}

// Main function
async function main() {
    console.log('Starting bundle image upload...\n');

    const bundleUpdates = [];

    for (const [bundleSlug, images] of Object.entries(bundleImages)) {
        console.log(`\nProcessing: ${bundleSlug}`);
        const uploadedUrls = [];

        for (const img of images) {
            try {
                console.log(`  Downloading: ${img.name}...`);
                const buffer = await downloadImage(img.url);

                const filename = `${bundleSlug}-${img.name}.jpg`;
                console.log(`  Uploading: ${filename}...`);
                const publicUrl = await uploadToSupabase(buffer, filename);

                if (publicUrl) {
                    uploadedUrls.push(publicUrl);
                    console.log(`  ✓ Uploaded: ${publicUrl}`);
                }
            } catch (err) {
                console.error(`  ✗ Failed for ${img.name}:`, err.message);
            }
        }

        if (uploadedUrls.length > 0) {
            bundleUpdates.push({
                slug: bundleSlug,
                image_url: uploadedUrls[0], // Primary image
                image_urls: uploadedUrls, // All images as array
            });
        }
    }

    // Generate SQL update statements
    console.log('\n\n=== SQL UPDATE STATEMENTS ===\n');
    for (const bundle of bundleUpdates) {
        console.log(`UPDATE bundles SET image_url = '${bundle.image_url}' WHERE slug = '${bundle.slug}';`);
    }

    console.log('\n\nDone! Run the above SQL in Supabase to update bundle images.');
}

main().catch(console.error);
