
import { supabase, parseCSV } from './import-utils';
import path from 'path';

async function importCustomizations() {
    console.log('Starting Office 365 Customizations Import...');

    const csvPath = path.join(process.cwd(), 'exported_data_csv', 'export_All-----customizations_2026-01-18_08-24-35.csv');
    const records = parseCSV(csvPath);

    console.log(`Found ${records.length} customizations.`);

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const toInsert = batch.map(record => {
            // CSV headers: "Address","Display Name","First name","is_customized","Last Name","Order Id","Phone Number"
            const orderId = record['Order Id'] || record['Order ID'];
            const displayName = record['Display Name'];
            if (!orderId || !displayName) return null;

            return {
                order_id: orderId,
                display_name: displayName,
                first_name: record['First name'] || null,
                last_name: record['Last Name'] || null,
                address: record['Address'] || null,
                phone_number: record['Phone Number'] || null,
                is_completed: record['is_customized'] === 'yes',
            };
        }).filter(item => item !== null);

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('office365_customizations')
                .upsert(toInsert, { onConflict: 'order_id' });

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

importCustomizations().catch(console.error);
