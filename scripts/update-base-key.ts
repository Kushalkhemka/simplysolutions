/**
 * Update license keys: prepend "YD9NP-" to keys starting with "Y2V7F-H9KV4-MGJ7T-687GD"
 * Run with: npx tsx scripts/update-base-key.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const OLD_BASE = 'Y2V7F-H9KV4-MGJ7T-687GD';
const NEW_BASE = 'YD9NP-Y2V7F-H9KV4-MGJ7T-687GD';

async function updateKeys() {
    // Step 1: Find all keys starting with the old base
    const { data: keys, error: fetchError } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key')
        .ilike('license_key', OLD_BASE + '%');

    if (fetchError) {
        console.error('Error fetching keys:', fetchError);
        return;
    }

    if (!keys || keys.length === 0) {
        console.log('No keys found.');
        return;
    }

    console.log(`Found ${keys.length} keys to update:\n`);

    // Step 2: Update each key by prepending "YD9NP-"
    let successCount = 0;
    for (const key of keys) {
        const oldKey = key.license_key;
        const newKey = 'YD9NP-' + oldKey;

        console.log(`  ${oldKey}`);
        console.log(`  → ${newKey}`);

        const { error: updateError } = await supabase
            .from('amazon_activation_license_keys')
            .update({ license_key: newKey })
            .eq('id', key.id);

        if (updateError) {
            console.log(`  ❌ Error: ${updateError.message}\n`);
        } else {
            console.log(`  ✅ Updated\n`);
            successCount++;
        }
    }

    console.log(`\nDone! Updated ${successCount}/${keys.length} keys.`);
}

updateKeys();
