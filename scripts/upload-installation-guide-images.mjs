#!/usr/bin/env node

/**
 * Script to download installation guide images from external URLs and upload to Supabase
 * Run with: SUPABASE_SERVICE_ROLE_KEY=xxx node scripts/upload-installation-guide-images.mjs
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';

// Supabase config
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://supabase-supabase2.exxngc.easypanel.host';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Extract all image URLs from markdown files
function extractImageUrls(mdContent) {
    const urls = [];
    // Match markdown images: ![alt](url)
    const mdRegex = /!\[.*?\]\((https?:\/\/[^)]+)\)/g;
    // Match BBCode images: [img]url[/img]
    const bbcodeRegex = /\[img[^\]]*\](https?:\/\/[^\[]+)\[\/img\]/gi;

    let match;
    while ((match = mdRegex.exec(mdContent)) !== null) {
        urls.push(match[1]);
    }
    while ((match = bbcodeRegex.exec(mdContent)) !== null) {
        urls.push(match[1]);
    }

    return [...new Set(urls)]; // Remove duplicates
}

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
                contentType: response.headers['content-type'] || 'image/jpeg'
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

// Generate filename from URL
function getFilenameFromUrl(url) {
    const urlPath = new URL(url).pathname;
    const originalName = path.basename(urlPath);
    // Clean filename
    return originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
}

// Get content type from extension
function getContentType(filename) {
    const ext = path.extname(filename).toLowerCase();
    const types = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp'
    };
    return types[ext] || 'image/jpeg';
}

// Upload to Supabase storage
async function uploadToSupabase(buffer, filename, contentType) {
    const { data, error } = await supabase.storage
        .from('product-assets')
        .upload(`installation-guide-images/${filename}`, buffer, {
            contentType,
            upsert: true,
        });

    if (error) {
        console.error(`  Error uploading ${filename}:`, error.message);
        return null;
    }

    const { data: urlData } = supabase.storage
        .from('product-assets')
        .getPublicUrl(`installation-guide-images/${filename}`);

    return urlData.publicUrl;
}

// Main function
async function main() {
    console.log('=== Installation Guide Image Uploader ===\n');
    console.log(`Supabase URL: ${SUPABASE_URL}\n`);

    const guidesDir = './public/installation-guides';
    const files = fs.readdirSync(guidesDir).filter(f => f.endsWith('.md'));

    console.log(`Found ${files.length} markdown files\n`);

    const urlMapping = {}; // old URL -> new URL
    const allUrls = new Set();

    // Collect all unique URLs
    for (const file of files) {
        const content = fs.readFileSync(path.join(guidesDir, file), 'utf-8');
        const urls = extractImageUrls(content);
        urls.forEach(url => allUrls.add(url));
    }

    console.log(`Found ${allUrls.size} unique image URLs to upload\n`);

    // Download and upload each image
    let uploaded = 0;
    let failed = 0;

    for (const url of allUrls) {
        const filename = getFilenameFromUrl(url);
        console.log(`Processing: ${filename}`);
        console.log(`  Source: ${url}`);

        try {
            const { buffer, contentType } = await downloadImage(url);
            const newUrl = await uploadToSupabase(buffer, filename, contentType);

            if (newUrl) {
                urlMapping[url] = newUrl;
                console.log(`  ✓ Uploaded: ${newUrl}`);
                uploaded++;
            } else {
                failed++;
            }
        } catch (err) {
            console.error(`  ✗ Failed: ${err.message}`);
            failed++;
        }
    }

    console.log(`\n=== Upload Summary ===`);
    console.log(`Uploaded: ${uploaded}`);
    console.log(`Failed: ${failed}`);

    if (Object.keys(urlMapping).length > 0) {
        console.log('\n=== Updating Markdown Files ===\n');

        // Update markdown files with new URLs
        for (const file of files) {
            const filePath = path.join(guidesDir, file);
            let content = fs.readFileSync(filePath, 'utf-8');
            let changes = 0;

            for (const [oldUrl, newUrl] of Object.entries(urlMapping)) {
                if (content.includes(oldUrl)) {
                    content = content.split(oldUrl).join(newUrl);
                    changes++;
                }
            }

            if (changes > 0) {
                fs.writeFileSync(filePath, content);
                console.log(`Updated ${file}: ${changes} URLs replaced`);
            }
        }

        console.log('\n✓ Done! Markdown files updated with new Supabase URLs.');
    }

    // Save URL mapping for reference
    fs.writeFileSync('./scripts/url-mapping.json', JSON.stringify(urlMapping, null, 2));
    console.log('\nURL mapping saved to scripts/url-mapping.json');
}

main().catch(console.error);
