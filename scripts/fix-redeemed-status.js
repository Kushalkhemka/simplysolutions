const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixKeys() {
    console.log('Reading CSV...');

    // Read CSV
    const csv = fs.readFileSync('./exported_data_csv/export_All-Activation-Keys_2026-01-18_08-23-14.csv', 'utf-8');
    const lines = csv.split('\n').slice(1).filter(l => l.trim());

    const csvData = [];
    for (const line of lines) {
        const match = line.match(/^"([^"]*)","([^"]*)","([^"]*)"/);
        if (match) {
            csvData.push({
                key: match[1].replace(/-+$/, '').trim(), // Remove trailing dashes
                fsn: match[2],
                isRedeemed: match[3].toLowerCase() === 'yes'
            });
        }
    }

    // Get unredeemed keys from CSV (these should be available)
    const unredeemedInCsv = csvData.filter(r => !r.isRedeemed && r.key && r.fsn);

    console.log('Total unredeemed keys in CSV:', unredeemedInCsv.length);

    let fixed = 0;
    let notFound = 0;
    let alreadyCorrect = 0;
    let errors = 0;

    // Process in batches
    for (let i = 0; i < unredeemedInCsv.length; i++) {
        const row = unredeemedInCsv[i];

        // First check current status
        const { data: existing, error: findError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, is_redeemed')
            .eq('license_key', row.key)
            .maybeSingle();

        if (findError) {
            console.log(`Error finding ${row.key}:`, findError.message);
            errors++;
            continue;
        }

        if (!existing) {
            console.log(`NOT FOUND: ${row.key} (FSN: ${row.fsn})`);
            notFound++;
            continue;
        }

        if (existing.is_redeemed === false) {
            alreadyCorrect++;
            continue;
        }

        // Key exists but is marked as redeemed - fix it
        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({ is_redeemed: false, order_id: null })
            .eq('id', existing.id);

        if (updateError) {
            console.log(`Error updating ${row.key}:`, updateError.message);
            errors++;
        } else {
            console.log(`FIXED: ${row.key} (FSN: ${row.fsn}) - set to unredeemed`);
            fixed++;
        }
    }

    console.log('\n=== SUMMARY ===');
    console.log('Total unredeemed in CSV:', unredeemedInCsv.length);
    console.log('Already correct:', alreadyCorrect);
    console.log('Fixed (set to unredeemed):', fixed);
    console.log('Not found in DB:', notFound);
    console.log('Errors:', errors);

    // Verify FSN counts after fix
    console.log('\n=== VERIFICATION ===');
    const fsns = [...new Set(unredeemedInCsv.map(r => r.fsn).filter(Boolean))];

    for (const fsn of fsns.slice(0, 10)) {
        const { count } = await supabase
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('fsn', fsn)
            .eq('is_redeemed', false);

        console.log(`${fsn}: ${count || 0} available`);
    }
}

fixKeys().catch(console.error);
