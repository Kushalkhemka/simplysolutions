/**
 * Import Missing Unredeemed Keys from CSV
 * Imports keys from CSV that have empty is_redeemed field
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CsvKey {
    licenseKey: string;
    fsn: string;
    isRedeemed: boolean;
}

function parseCSV(csvPath: string): CsvKey[] {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    const keys: CsvKey[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        // Parse CSV line (simple parsing for this format)
        const match = line.match(/^"([^"]*)"(?:,"([^"]*)")*$/);
        if (!match) continue;

        // Split by ","
        const parts = line.match(/"([^"]*)"/g)?.map(p => p.replace(/"/g, '')) || [];
        if (parts.length < 3) continue;

        const licenseKey = parts[0];
        const fsn = parts[1];
        const isRedeemedStr = parts[2];

        // Only get keys with empty is_redeemed (unredeemed)
        if (isRedeemedStr === '') {
            keys.push({
                licenseKey,
                fsn,
                isRedeemed: false
            });
        }
    }

    return keys;
}

async function importMissingKeys() {
    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Activation-Keys_2026-01-18_08-23-14.csv');

    console.log('=== Import Missing Unredeemed Keys ===\n');
    console.log(`Reading CSV: ${csvPath}`);

    const csvKeys = parseCSV(csvPath);
    console.log(`Found ${csvKeys.length} unredeemed keys in CSV`);

    if (csvKeys.length === 0) {
        console.log('No unredeemed keys to import');
        return;
    }

    // Check which keys already exist in database
    const licenseKeys = csvKeys.map(k => k.licenseKey);
    const { data: existingKeys } = await supabase
        .from('amazon_activation_license_keys')
        .select('license_key')
        .in('license_key', licenseKeys);

    const existingSet = new Set((existingKeys || []).map(k => k.license_key));
    const newKeys = csvKeys.filter(k => !existingSet.has(k.licenseKey));

    console.log(`Existing in DB: ${existingSet.size}`);
    console.log(`New to import: ${newKeys.length}`);

    if (newKeys.length === 0) {
        console.log('No new keys to import');
        return;
    }

    // Import new keys
    console.log('\nImporting new keys...');
    const keysToInsert = newKeys.map(k => ({
        license_key: k.licenseKey,
        fsn: k.fsn,
        is_redeemed: false
    }));

    const { error } = await supabase
        .from('amazon_activation_license_keys')
        .insert(keysToInsert);

    if (error) {
        console.error('Import error:', error.message);
    } else {
        console.log(`✓ Imported ${keysToInsert.length} new unredeemed keys`);
    }

    // Group by FSN
    const byFsn = new Map<string, number>();
    for (const k of keysToInsert) {
        byFsn.set(k.fsn, (byFsn.get(k.fsn) || 0) + 1);
    }
    console.log('\nImported by FSN:');
    for (const [fsn, count] of byFsn) {
        console.log(`  ${fsn}: ${count} keys`);
    }
}

importMissingKeys().catch(console.error);
