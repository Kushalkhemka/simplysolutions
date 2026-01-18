
import { supabase, parseCSV } from './import-utils';
import path from 'path';

async function importWarranty() {
    console.log('Starting Warranty Import...');

    const csvPath = path.join(process.cwd(), 'exported_data_csv', 'export_All-Warranty-Data_2026-01-18_08-24-18.csv');
    const records = parseCSV(csvPath);

    console.log(`Found ${records.length} warranty records.`);

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const toInsert = batch.map(record => {
            // CSV headers: "contact","status","ORDER ID","STEP 1","STEP 2","Creation Date","Modified Date"
            const orderId = record['ORDER ID'];
            if (!orderId) return null;

            // Map status: REJECTED -> REJECTED, APPROVED -> VERIFIED, else PROCESSING
            let status = 'PROCESSING';
            if (record['status'] === 'REJECTED') status = 'REJECTED';
            else if (record['status'] === 'APPROVED') status = 'VERIFIED';

            return {
                order_id: orderId,
                contact: record['contact'] || null,
                status: status,
                screenshot_seller_feedback: record['STEP 1'] ? `https:${record['STEP 1']}` : null,
                screenshot_product_review: record['STEP 2'] ? `https:${record['STEP 2']}` : null,
            };
        }).filter(item => item !== null);

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('warranty_registrations')
                .insert(toInsert);

            if (error) {
                console.error(`Error batch ${i}:`, error.message);
                errorCount += toInsert.length;
            } else {
                successCount += toInsert.length;
                process.stdout.write('.');
            }
        }
    }

    console.log(`\nImport complete. Success: ${successCount}, Errors: ${errorCount}`);
}

importWarranty().catch(console.error);
