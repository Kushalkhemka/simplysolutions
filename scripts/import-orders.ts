
import { supabase, parseCSV } from './import-utils';
import path from 'path';

async function importOrders() {
    console.log('Starting Orders Import...');

    const csvPath = path.join(process.cwd(), 'exported_data_csv', 'export_All-Orders_2026-01-18_08-23-53.csv');
    const records = parseCSV(csvPath);

    console.log(`Found ${records.length} orders.`);

    let successCount = 0;
    let errorCount = 0;
    const BATCH_SIZE = 100;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
        const batch = records.slice(i, i + BATCH_SIZE);

        const toInsert = batch.map(record => {
            // Use exact column names from CSV: "Activation Key","Confirmation ID","CONTACT","FSN","in_warranty","Installation ID","ORDER ID"
            const orderId = record['ORDER ID'];
            if (!orderId) return null;

            return {
                order_id: orderId,
                confirmation_id: record['Confirmation ID'] || null,
                contact_email: record['CONTACT'] || null,
                fsn: record['FSN'] || null,
                warranty_status: record['in_warranty'] === 'yes' ? 'APPROVED' : 'PENDING',
                installation_id: record['Installation ID'] || null,
                fulfillment_type: orderId.includes('-') ? 'amazon_digital' : 'amazon_fba',
            };
        }).filter(item => item !== null);

        if (toInsert.length > 0) {
            const { error } = await supabase
                .from('amazon_orders')
                .upsert(toInsert, { onConflict: 'order_id' });

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

importOrders().catch(console.error);
