
import { supabase, parseCSV } from './import-utils';
import path from 'path';

async function importLicenseKeys() {
    console.log('Starting License Keys Import...');

    const csvPath = path.join(process.cwd(), 'exported_data_csv', 'export_All-Activation-Keys_2026-01-18_08-23-14.csv');
    const records = parseCSV(csvPath);

    console.log(`Found ${records.length} license key records.`);

    let successCount = 0;
    let errorCount = 0;

    // Batch processing
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);
        const toInsert = batch.map(record => {
            const originalKey = record['License Key'];
            // Remove trailing dashes for the active key
            const cleanKey = originalKey ? originalKey.replace(/-+$/, '') : '';

            if (!cleanKey) return null;

            return {
                license_key: cleanKey,
                original_key: originalKey,
                sku: record['FSN (Product Data)'] || 'UNKNOWN',
                is_redeemed: record['is_redeemed'] === 'yes', // map 'yes' to boolean
                supported_os: record['Supported OS'],
                legacy_fsn: record['FSN (Product Data)'],
                imported_at: new Date().toISOString()
            };
        }).filter(item => item !== null);

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('amazon_activation_license_keys')
                .insert(toInsert);

            if (error) {
                console.error(`Error active batch ${i}:`, error.message);
                errorCount += toInsert.length;
            } else {
                successCount += toInsert.length;
                console.log(`Imported batch ${i} - ${i + toInsert.length}`);
            }
        }
    }

    console.log(`Import complete. Success: ${successCount}, Errors: ${errorCount}`);
}

importLicenseKeys().catch(console.error);
