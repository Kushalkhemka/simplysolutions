/**
 * Clean import of amazon_orders from CSV
 * Drops all existing data and re-imports with proper linking
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
    'https://supabase-supabase2.exxngc.easypanel.host',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

interface CsvRow {
    activationKey: string;
    confirmationId: string;
    contact: string;
    fsn: string;
    inWarranty: string;
    installationId: string;
    orderId: string;
}

function parseCSV(content: string): CsvRow[] {
    const lines = content.split('\n').filter(l => l.trim());
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const values = matches.map(v => v.replace(/^"|"$/g, '').trim());

        if (values.length >= 7 && values[6]) {  // Must have ORDER ID
            rows.push({
                activationKey: values[0] || '',
                confirmationId: values[1] || '',
                contact: values[2] || '',
                fsn: values[3] || '',
                inWarranty: values[4] || '',
                installationId: values[5] || '',
                orderId: values[6] || ''
            });
        }
    }

    return rows;
}

async function cleanImport() {
    console.log('=== Clean Amazon Orders Import ===\n');

    // 1. Drop all existing data
    console.log('1. Deleting all amazon_orders...');
    const { error: deleteOrdersError } = await supabase
        .from('amazon_orders')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteOrdersError) {
        console.log('Error deleting orders:', deleteOrdersError.message);
    } else {
        console.log('   ✓ All orders deleted');
    }

    console.log('\n2. Deleting all license keys...');
    const { error: deleteKeysError } = await supabase
        .from('amazon_activation_license_keys')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000');

    if (deleteKeysError) {
        console.log('Error deleting keys:', deleteKeysError.message);
    } else {
        console.log('   ✓ All license keys deleted');
    }

    // 2. Read CSV
    console.log('\n3. Reading CSV file...');
    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Orders_2026-01-18_08-23-53.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);
    console.log(`   Found ${rows.length} valid rows`);

    // 3. Group by FSN to batch insert license keys
    const keysByFsn = new Map<string, string[]>();
    const orderData: any[] = [];

    for (const row of rows) {
        const orderId = row.orderId.trim();
        const licenseKey = row.activationKey.replace(/--+$/, '').replace(/----$/, '').trim();
        const fsn = row.fsn.trim();
        const confirmationId = row.confirmationId.trim();
        const installationId = row.installationId.trim();

        // Determine fulfillment type
        const isDigital = /^\d{15,17}$/.test(orderId);

        orderData.push({
            orderId,
            licenseKey,
            fsn,
            confirmationId,
            installationId,
            isDigital
        });

        // Track keys by FSN
        if (fsn && licenseKey) {
            if (!keysByFsn.has(fsn)) {
                keysByFsn.set(fsn, []);
            }
            keysByFsn.get(fsn)!.push(licenseKey);
        }
    }

    // 4. Insert license keys and get mapping
    console.log('\n4. Inserting license keys...');
    const keyToId = new Map<string, string>();

    for (const [fsn, keys] of keysByFsn) {
        const uniqueKeys = [...new Set(keys)];

        for (const key of uniqueKeys) {
            const { data, error } = await supabase
                .from('amazon_activation_license_keys')
                .insert({
                    license_key: key,
                    fsn: fsn,
                    is_redeemed: true
                })
                .select('id')
                .single();

            if (data) {
                keyToId.set(key, data.id);
            }
        }
    }
    console.log(`   ✓ Inserted ${keyToId.size} unique license keys`);

    // 5. Insert orders in batches
    console.log('\n5. Inserting orders...');
    let inserted = 0;
    let errors = 0;
    const batchSize = 100;

    for (let i = 0; i < orderData.length; i += batchSize) {
        const batch = orderData.slice(i, i + batchSize);

        const ordersToInsert = batch.map(o => ({
            order_id: o.orderId,
            fsn: o.fsn || null,
            license_key_id: keyToId.get(o.licenseKey) || null,
            confirmation_id: o.confirmationId || null,
            installation_id: o.installationId || null,
            fulfillment_type: o.isDigital ? 'amazon_digital' : 'amazon_fba',
            getcid_used: !!o.confirmationId,
            getcid_used_at: o.confirmationId ? new Date().toISOString() : null,
            warranty_status: 'PENDING'
        }));

        const { error } = await supabase
            .from('amazon_orders')
            .insert(ordersToInsert);

        if (error) {
            console.log(`   Batch ${i}-${i + batchSize} error:`, error.message);
            errors += batch.length;
        } else {
            inserted += batch.length;
        }

        // Progress
        if ((i + batchSize) % 1000 === 0 || i + batchSize >= orderData.length) {
            console.log(`   Progress: ${Math.min(i + batchSize, orderData.length)}/${orderData.length}`);
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Total CSV rows: ${rows.length}`);
    console.log(`License keys created: ${keyToId.size}`);
    console.log(`Orders inserted: ${inserted}`);
    console.log(`Errors: ${errors}`);

    // 6. Verify
    const { count: orderCount } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true });

    const { count: keyCount } = await supabase
        .from('amazon_activation_license_keys')
        .select('*', { count: 'exact', head: true });

    console.log(`\n=== Verification ===`);
    console.log(`Orders in DB: ${orderCount}`);
    console.log(`Keys in DB: ${keyCount}`);
}

cleanImport().catch(console.error);
