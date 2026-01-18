import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';
import https from 'https';
import http from 'http';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'product-assets';
const FOLDER_NAME = 'product-images';

// Download image from URL
async function downloadImage(url: string): Promise<Buffer | null> {
    return new Promise((resolve) => {
        // Fix URL if it starts with //
        let fullUrl = url;
        if (url.startsWith('//')) {
            fullUrl = 'https:' + url;
        }

        const protocol = fullUrl.startsWith('https') ? https : http;

        protocol.get(fullUrl, (response) => {
            // Handle redirects
            if (response.statusCode === 301 || response.statusCode === 302) {
                const redirectUrl = response.headers.location;
                if (redirectUrl) {
                    downloadImage(redirectUrl).then(resolve);
                    return;
                }
            }

            if (response.statusCode !== 200) {
                console.log(`  Failed to download: ${response.statusCode}`);
                resolve(null);
                return;
            }

            const chunks: Buffer[] = [];
            response.on('data', (chunk) => chunks.push(chunk));
            response.on('end', () => resolve(Buffer.concat(chunks)));
            response.on('error', () => resolve(null));
        }).on('error', (err) => {
            console.log(`  Download error: ${err.message}`);
            resolve(null);
        });
    });
}

// Get file extension from URL
function getExtension(url: string): string {
    const match = url.match(/\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i);
    if (match) return match[1].toLowerCase();
    // Default to webp for unknown
    return 'webp';
}

// Clean FSN for filename
function cleanFilename(fsn: string): string {
    return fsn.replace(/[^a-zA-Z0-9_-]/g, '_');
}

async function migrateImages() {
    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Product-Data_2026-01-18_08-24-02.csv');

    if (!fs.existsSync(csvPath)) {
        console.error('CSV file not found:', csvPath);
        process.exit(1);
    }

    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const records = parse(csvContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
    });

    console.log(`Found ${records.length} products in CSV`);
    console.log('Starting image migration to Supabase storage...\n');

    let successCount = 0;
    let skipCount = 0;
    let failCount = 0;

    for (const record of records) {
        const fsn = record['FSN'];
        const imageUrl = record['Product Image'];

        if (!fsn || !imageUrl || fsn === 'MISSING' || fsn === 'API_KEY_USED') {
            skipCount++;
            continue;
        }

        console.log(`Processing: ${fsn}`);

        // Download the image
        const imageData = await downloadImage(imageUrl);

        if (!imageData) {
            console.log(`  ✗ Failed to download image`);
            failCount++;
            continue;
        }

        // Determine extension and filename
        const ext = getExtension(imageUrl);
        const filename = `${FOLDER_NAME}/${cleanFilename(fsn)}.${ext}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabase.storage
            .from(BUCKET_NAME)
            .upload(filename, imageData, {
                contentType: `image/${ext === 'jpg' ? 'jpeg' : ext}`,
                upsert: true,
            });

        if (uploadError) {
            console.log(`  ✗ Upload failed: ${uploadError.message}`);
            failCount++;
            continue;
        }

        // Get public URL
        const { data: publicUrl } = supabase.storage
            .from(BUCKET_NAME)
            .getPublicUrl(filename);

        console.log(`  ✓ Uploaded: ${publicUrl.publicUrl}`);
        successCount++;

        // Add small delay to avoid rate limiting
        await new Promise(r => setTimeout(r, 200));
    }

    console.log('\n--- Migration Summary ---');
    console.log(`Success: ${successCount}`);
    console.log(`Failed: ${failCount}`);
    console.log(`Skipped: ${skipCount}`);
}

migrateImages().catch(console.error);
