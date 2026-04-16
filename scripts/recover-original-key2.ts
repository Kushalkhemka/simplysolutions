/**
 * Recover original key using the license_key_id from the order
 * Run with: npx tsx scripts/recover-original-key2.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const LICENSE_KEY_ID = '257ee388-c246-4196-b7a8-d1e48630cf92';

async function recoverKey() {
    console.log(`\n🔍 Looking up license key ID: ${LICENSE_KEY_ID}\n`);

    // Get the license key record by ID
    const { data: keyRow, error } = await supabase
        .from('amazon_activation_license_keys')
        .select('*')
        .eq('id', LICENSE_KEY_ID)
        .single();

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('📋 Full license key record:');
    console.log(JSON.stringify(keyRow, null, 2));

    // Also check the amazon_orders table for the license_key column
    const { data: orderRow } = await supabase
        .from('amazon_orders')
        .select('order_id, license_key_id, fsn')
        .eq('license_key_id', LICENSE_KEY_ID)
        .maybeSingle();

    console.log('\n📋 Linked order:');
    console.log(JSON.stringify(orderRow, null, 2));

    console.log('\n' + '═'.repeat(70));

    if (keyRow) {
        console.log(`\n  Current license key: ${keyRow.license_key}`);
        if (keyRow.original_key) {
            console.log(`  Original key (stored): ${keyRow.original_key}`);
        } else {
            console.log(`  ⚠️  No 'original_key' field found.`);
        }
        console.log(`  Order ID on key: ${keyRow.order_id || 'N/A'}`);
        console.log(`  FSN: ${keyRow.fsn || 'N/A'}`);
    }
}

recoverKey();
