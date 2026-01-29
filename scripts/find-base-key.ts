/**
 * Script to find multiple base keys and all their variations
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const BASE_KEYS = [
    'MHCN3-2YG4W-T3DFG-YCT34-4X8XM',
    '8K3QC-4N8B8-6F7CC-CWDWQ-2WF9M',
    'XQCTN-DQJF6-QJW9Q-7CVBW-MTDGY',
    '8GN4C-KH9G8-GMT9K-WQ8FP-76DGY'
];

async function findAllBaseKeys() {
    console.log('🔍 Searching for all 4 base keys and their variations...\n');
    console.log('Base keys:');
    BASE_KEYS.forEach((key, i) => console.log(`  ${i + 1}. ${key}`));
    console.log('\n' + '='.repeat(110));

    let grandTotal = 0;

    for (const baseKey of BASE_KEYS) {
        console.log(`\n📋 Searching for: ${baseKey}`);
        console.log('-'.repeat(110));

        // Search for keys starting with this base key
        const { data: keys, error } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn, is_redeemed, order_id, created_at')
            .ilike('license_key', baseKey + '%')
            .order('license_key', { ascending: true });

        if (error) {
            console.error('  Error:', error.message);
            continue;
        }

        if (!keys || keys.length === 0) {
            console.log('  ❌ No keys found');
            continue;
        }

        grandTotal += keys.length;

        const redeemed = keys.filter(k => k.is_redeemed).length;
        const available = keys.length - redeemed;

        console.log(`  ✅ Found ${keys.length} keys (${redeemed} redeemed, ${available} available)\n`);

        // Group by variation
        const variations: Record<string, typeof keys> = {};
        keys.forEach(key => {
            const suffix = key.license_key.substring(baseKey.length) || '(exact)';
            if (!variations[suffix]) {
                variations[suffix] = [];
            }
            variations[suffix].push(key);
        });

        // Print each variation
        console.log('  ' + 'Variation'.padEnd(15) + 'FSN'.padEnd(22) + 'Redeemed'.padEnd(10) + 'Order ID');
        console.log('  ' + '-'.repeat(100));

        for (const [suffix, varKeys] of Object.entries(variations).sort()) {
            for (const key of varKeys) {
                const displaySuffix = suffix.length > 12 ? suffix.substring(0, 12) + '...' : suffix;
                console.log(
                    '  ' +
                    displaySuffix.padEnd(15) +
                    (key.fsn || 'N/A').padEnd(22) +
                    (key.is_redeemed ? 'Yes' : 'No').padEnd(10) +
                    (key.order_id || 'N/A')
                );
            }
        }
    }

    console.log('\n' + '='.repeat(110));
    console.log(`\n📊 GRAND TOTAL: ${grandTotal} keys found across all 4 base keys`);
}

findAllBaseKeys();
