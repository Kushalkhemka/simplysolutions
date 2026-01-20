const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addMissingKeys() {
    console.log('Reading CSV...');

    // Read CSV
    const csv = fs.readFileSync('./exported_data_csv/export_All-Activation-Keys_2026-01-18_08-23-14.csv', 'utf-8');
    const lines = csv.split('\n').slice(1).filter(l => l.trim());

    const csvData = [];
    for (const line of lines) {
        const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)"/);
        if (match) {
            csvData.push({
                key: match[1].replace(/-+$/, '').trim(), // Remove trailing dashes only
                fsn: match[2],
                isRedeemed: match[3].toLowerCase() === 'yes'
            });
        }
    }

    // Get unredeemed keys from CSV (these should be available)
    const unredeemedInCsv = csvData.filter(r => !r.isRedeemed && r.key && r.fsn);

    console.log('Total unredeemed keys in CSV:', unredeemedInCsv.length);

    let added = 0;
    let alreadyExists = 0;
    let errors = 0;

    for (const row of unredeemedInCsv) {
        // Check if key already exists
        const { data: existing } = await supabase
            .from('amazon_activation_license_keys')
            .select('id')
            .eq('license_key', row.key)
            .maybeSingle();

        if (existing) {
            alreadyExists++;
            continue;
        }

        // Add the missing key
        const { error } = await supabase
            .from('amazon_activation_license_keys')
            .insert({
                license_key: row.key,
                fsn: row.fsn,
                is_redeemed: false
            });

        if (error) {
            console.log(`Error adding ${row.key}:`, error.message);
            errors++;
        } else {
            console.log(`ADDED: ${row.key} (FSN: ${row.fsn})`);
            added++;
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log('Total unredeemed in CSV:', unredeemedInCsv.length);
    console.log('Already exists in DB:', alreadyExists);
    console.log('Added:', added);
    console.log('Errors:', errors);

    // Verify FSN counts after adding
    console.log('\n=== VERIFICATION - Available Keys by FSN ===');
    const fsns = [...new Set(unredeemedInCsv.map(r => r.fsn).filter(Boolean))];

    for (const fsn of fsns) {
        const { count } = await supabase
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('fsn', fsn)
            .eq('is_redeemed', false);

        console.log(`${fsn}: ${count || 0} available`);
    }
}

addMissingKeys().catch(console.error);
