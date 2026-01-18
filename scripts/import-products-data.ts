import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

const BUCKET_NAME = 'product-assets';
const FOLDER_NAME = 'product-images';

// Clean FSN for filename
function cleanFilename(fsn: string): string {
    return fsn.replace(/[^a-zA-Z0-9_-]/g, '_');
}

// Get extension from original URL
function getExtension(url: string): string {
    const match = url.match(/\.(png|jpg|jpeg|webp|gif|avif)(\?.*)?$/i);
    if (match) return match[1].toLowerCase();
    return 'webp';
}

// Generate Supabase storage URL for the image
function getStorageUrl(fsn: string, originalUrl: string): string {
    const ext = getExtension(originalUrl);
    const filename = `${FOLDER_NAME}/${cleanFilename(fsn)}.${ext}`;
    return `${supabaseUrl}/storage/v1/object/public/${BUCKET_NAME}/${filename}`;
}

// Mapping of FSN to installation doc filename
const installationDocMap: Record<string, string> = {
    // Office 2021
    'OFFGHYUUFTD9NQNE': 'office2021.md',
    'OFFG9MREFCXD658G': 'office2021.md',
    'PPBOX21': 'office2021.md',

    // Office 2019
    'OPSG4ZTTK5MMZWPB': 'office2019.md',
    'OPSG4ZTTK5MMZWPB_ALI': 'office2019.md',

    // Office 2024
    'OFFICE2024-WIN': 'office2024win.md',
    'OFFICE2024-MAC': 'office2024mac.md',

    // Office 365
    'OFFICE365': 'office365.md',
    '365E5': 'office365ent.md',

    // Home & Business / Student
    'OFFGD398CP5ME6DKSTD': 'home_student_2021.md',
    'OFTFTUVWT2ZMGZK7': 'hb2019.md',
    'HB2021': 'hb2021.md',
    'HB2019': 'hb2019.md',

    // Visio & Project
    'VISIO2021': 'visio2021.md',
    'VISIO2019': 'visio2021.md',
    'PROJECT2021': 'project2021.md',
    'PROJECT2019': 'project2021.md',

    // Windows
    'OPSG3TNK9HZDZEM9': 'win11-win10pro_noupgrade.md',
    'OPSGZ8QG4JZ3AHMV': 'win11-win10pro_noupgrade.md',
    'WINDOWS11': 'win11-win10pro_noupgrade.md',
    'WIN11HOME': 'win11-win10pro_noupgrade.md',
    'WIN10ENTERPRISE': 'win11-win10pro_noupgrade.md',
    'WIN11ENTERPRISE': 'win11-win10pro_noupgrade.md',

    // Combos
    'WIN11-PP21': 'win11-pp2021_combo.md',
    'WIN10-PP21': 'win11-pp2021_combo.md',

    // Office 2016
    'PP2016': 'office2019.md', // Similar activation process

    // GetCID for phone activation
    'API_KEY_USED': 'getcid.md',
};

async function importProducts() {
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

    let successCount = 0;
    let skipCount = 0;

    for (const record of records) {
        const fsn = record['FSN'];
        const productTitle = record['Product Title'];

        // Skip entries without FSN or title
        if (!fsn || !productTitle || fsn === 'MISSING') {
            skipCount++;
            continue;
        }

        // Prepare the data - use Supabase storage URL for images
        const originalImageUrl = record['Product Image'] || '';
        const productData = {
            fsn: fsn,
            product_title: productTitle,
            download_link: record['Download Link'] || null,
            product_image: originalImageUrl ? getStorageUrl(fsn, originalImageUrl) : null,
            original_image_url: originalImageUrl || null, // Keep original for reference
            installation_doc: installationDocMap[fsn] || null,
            slug: record['Slug'] || null,
        };

        // Upsert the record
        const { error } = await supabase
            .from('products_data')
            .upsert(productData, { onConflict: 'fsn' });

        if (error) {
            console.error(`Error inserting ${fsn}:`, error.message);
        } else {
            successCount++;
            console.log(`✓ ${fsn}: ${productTitle.substring(0, 50)}...`);
        }
    }

    console.log('\n--- Import Summary ---');
    console.log(`Success: ${successCount}`);
    console.log(`Skipped: ${skipCount}`);
}

importProducts().catch(console.error);
