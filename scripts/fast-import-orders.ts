/**
 * FAST import of amazon_orders from CSV using batch operations
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
    'https://supabase-supabase2.exxngc.easypanel.host',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

function parseCSV(content: string) {
    const lines = content.split('\n').filter(l => l.trim());
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const values = matches.map(v => v.replace(/^"|"$/g, '').trim());

        if (values.length >= 7 && values[6]) {
            const orderId = values[6].trim();
            const licenseKey = (values[0] || '').replace(/--+$/, '').trim();
            const confirmationId = values[1].trim();
            const fsn = values[3].trim();
            const installationId = values[5].trim();
            const isDigital = /^\d{15,17}$/.test(orderId);

            rows.push({ orderId, licenseKey, confirmationId, fsn, installationId, isDigital });
        }
    }
    return rows;
}

async function fastImport() {
    console.log('=== FAST Amazon Orders Import ===\n');

    // 1. Delete existing data
    console.log('1. Clearing data...');
    await supabase.from('amazon_orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('amazon_activation_license_keys').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    console.log('   ✓ Done');

    // 2. Read CSV
    console.log('\n2. Reading CSV...');
    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Orders_2026-01-18_08-23-53.csv');
    const rows = parseCSV(fs.readFileSync(csvPath, 'utf-8'));
    console.log(`   Found ${rows.length} rows`);

    // 3. Get unique license keys
    const uniqueKeys = new Map<string, { key: string, fsn: string }>();
    for (const row of rows) {
        if (row.licenseKey && !uniqueKeys.has(row.licenseKey)) {
            uniqueKeys.set(row.licenseKey, { key: row.licenseKey, fsn: row.fsn });
        }
    }
    console.log(`   Unique keys: ${uniqueKeys.size}`);

    // 4. Batch insert license keys (500 at a time)
    console.log('\n3. Inserting license keys...');
    const keyEntries = Array.from(uniqueKeys.values());
    const keyToId = new Map<string, string>();

    for (let i = 0; i < keyEntries.length; i += 500) {
        const batch = keyEntries.slice(i, i + 500).map(k => ({
            license_key: k.key,
            fsn: k.fsn || null,
            is_redeemed: true
        }));

        const { data, error } = await supabase
            .from('amazon_activation_license_keys')
            .insert(batch)
            .select('id, license_key');

        if (data) {
            data.forEach((d: any) => keyToId.set(d.license_key, d.id));
        }
        if (error) console.log(`   Batch error:`, error.message);
        console.log(`   Keys: ${Math.min(i + 500, keyEntries.length)}/${keyEntries.length}`);
    }

    // 5. Batch insert orders (500 at a time)
    console.log('\n4. Inserting orders...');
    for (let i = 0; i < rows.length; i += 500) {
        const batch = rows.slice(i, i + 500).map(r => ({
            order_id: r.orderId,
            fsn: r.fsn || null,
            license_key_id: keyToId.get(r.licenseKey) || null,
            confirmation_id: r.confirmationId || null,
            installation_id: r.installationId || null,
            fulfillment_type: r.isDigital ? 'amazon_digital' : 'amazon_fba',
            getcid_used: !!r.confirmationId,
            getcid_used_at: r.confirmationId ? new Date().toISOString() : null,
            warranty_status: 'PENDING'
        }));

        const { error } = await supabase.from('amazon_orders').insert(batch);
        if (error) console.log(`   Batch error:`, error.message);
        console.log(`   Orders: ${Math.min(i + 500, rows.length)}/${rows.length}`);
    }

    // 6. Verify
    const { count: orderCount } = await supabase.from('amazon_orders').select('*', { count: 'exact', head: true });
    const { count: keyCount } = await supabase.from('amazon_activation_license_keys').select('*', { count: 'exact', head: true });

    console.log('\n=== Done ===');
    console.log(`Orders: ${orderCount}`);
    console.log(`Keys: ${keyCount}`);
}

fastImport().catch(console.error);
