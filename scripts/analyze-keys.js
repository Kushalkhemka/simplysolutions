const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function analyze() {
    console.log('Reading CSV...');

    // Read CSV
    const csv = fs.readFileSync('./exported_data_csv/export_All-Activation-Keys_2026-01-18_08-23-14.csv', 'utf-8');
    const lines = csv.split('\n').slice(1).filter(l => l.trim());

    const csvData = [];
    for (const line of lines) {
        // Parse CSV line - handle quoted values
        const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)"/);
        if (match) {
            csvData.push({
                key: match[1].replace(/-+$/, '').trim(), // Remove trailing dashes
                fsn: match[2],
                isRedeemed: match[3].toLowerCase() === 'yes'
            });
        }
    }

    console.log('Total rows in CSV:', csvData.length);

    const unredeemedInCsv = csvData.filter(r => !r.isRedeemed);
    const redeemedInCsv = csvData.filter(r => r.isRedeemed);

    console.log('Unredeemed in CSV:', unredeemedInCsv.length);
    console.log('Redeemed in CSV:', redeemedInCsv.length);

    // Group by FSN
    const fsnGroups = {};
    unredeemedInCsv.forEach(r => {
        if (!fsnGroups[r.fsn]) fsnGroups[r.fsn] = [];
        fsnGroups[r.fsn].push(r.key);
    });

    console.log('\nUnredeemed keys by FSN:');
    for (const [fsn, keys] of Object.entries(fsnGroups)) {
        console.log(`  ${fsn}: ${keys.length} keys`);
    }

    // Check first 20 unredeemed keys in database
    console.log('\n--- Checking first 20 unredeemed keys in database ---');

    const sampleKeys = unredeemedInCsv.slice(0, 20).map(r => r.key);

    for (const key of sampleKeys) {
        const { data, error } = await supabase
            .from('amazon_activation_license_keys')
            .select('license_key, is_redeemed, fsn')
            .eq('license_key', key)
            .single();

        if (error && error.code !== 'PGRST116') {
            console.log(`${key}: DB ERROR - ${error.message}`);
        } else if (!data) {
            console.log(`${key}: NOT FOUND in database`);
        } else if (data.is_redeemed) {
            console.log(`${key}: MISMATCH - CSV=unredeemed, DB=redeemed`);
        } else {
            console.log(`${key}: OK - correctly marked unredeemed`);
        }
    }
}

analyze().catch(console.error);
