/**
 * Find the missing number between 1427 and 1433 to identify the original username
 * Run with: npx tsx scripts/find-missing-number.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findMissing() {
    // Check each number from 1428 to 1432
    for (let num = 1428; num <= 1432; num++) {
        const username = `${num}@ms365pro.online`;
        const { data, error } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, order_id')
            .ilike('license_key', `%${username}%`)
            .maybeSingle();

        if (data) {
            console.log(`  ✅ ${username} → exists (order: ${data.order_id || 'N/A'})`);
        } else {
            console.log(`  ❌ ${username} → NOT FOUND — this is likely the original username!`);
        }
    }
}

findMissing();
