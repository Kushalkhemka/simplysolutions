
import { supabase, parseCSV } from './import-utils';
import path from 'path';

async function importProductRequests() {
    console.log('Starting Product Requests Import...');

    const csvPath = path.join(process.cwd(), 'exported_data_csv', 'export_All-Product-Request-On-Emails_2026-01-18_08-24-07.csv');
    const records = parseCSV(csvPath);

    console.log(`Found ${records.length} product requests.`);

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const toInsert = batch.map(record => {
            // CSV headers: "EMAIL","FSN","is_completed","Mobile Number","ORDER ID","Creation Date","Modified Date"
            const email = record['EMAIL'];
            if (!email) return null;

            // Derive request type from FSN
            const fsn = record['FSN'] || '';
            let requestType = 'other';
            if (fsn.toUpperCase().includes('AUTOCAD')) requestType = 'autocad';
            else if (fsn.toUpperCase().includes('CANVA')) requestType = 'canva';
            else if (fsn.toUpperCase().includes('REVIT')) requestType = 'revit';
            else if (fsn.toUpperCase().includes('FUSION')) requestType = 'fusion360';
            else if (fsn.toUpperCase().includes('365E5') || fsn === '365E5') requestType = '365e5';

            return {
                email: email,
                fsn: fsn || null,
                mobile_number: record['Mobile Number'] || null,
                order_id: record['ORDER ID'] || null,
                request_type: requestType,
                is_completed: record['is_completed'] === 'yes',
            };
        }).filter(item => item !== null);

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('product_requests')
                .insert(toInsert);

            if (error) {
                console.error(`Error batch ${i}:`, error.message);
                errorCount += toInsert.length;
            } else {
                successCount += toInsert.length;
            }
        }
    }

    console.log(`\nImport complete. Success: ${successCount}, Errors: ${errorCount}`);
}

importProductRequests().catch(console.error);
