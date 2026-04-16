/**
 * Recover the original license key for order 171-9944034-5602704 before customization
 * Run with: npx tsx scripts/recover-original-key.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const ORDER_ID = '171-9944034-5602704';

async function recoverOriginalKey() {
    console.log(`\n🔍 Investigating order: ${ORDER_ID}\n`);

    // 1. Get the current license key from amazon_activation_license_keys
    const { data: keyRow } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, fsn, order_id, is_redeemed, created_at, original_key')
        .eq('order_id', ORDER_ID)
        .maybeSingle();

    console.log('📋 License key record:');
    console.log(JSON.stringify(keyRow, null, 2));

    // 2. Get the current order record
    const { data: orderRow } = await supabase
        .from('amazon_orders')
        .select('*')
        .eq('order_id', ORDER_ID)
        .maybeSingle();

    console.log('\n📋 Amazon order record:');
    console.log(JSON.stringify(orderRow, null, 2));

    // 3. Get the customization record
    const { data: customization } = await supabase
        .from('office365_customizations')
        .select('*')
        .eq('order_id', ORDER_ID)
        .maybeSingle();

    console.log('\n📋 Customization record:');
    console.log(JSON.stringify(customization, null, 2));

    // 4. Check if there's an original_key field or any audit trail
    if (keyRow) {
        console.log('\n' + '═'.repeat(70));
        console.log('  ANALYSIS');
        console.log('═'.repeat(70));
        
        const currentKey = keyRow.license_key;
        console.log(`\n  Current license key: ${currentKey}`);
        
        if (keyRow.original_key) {
            console.log(`  Original key (from original_key column): ${keyRow.original_key}`);
        }

        // The password is preserved during customization, only username changes
        const passwordMatch = currentKey?.match(/Password\s*:\s*(.+)/i);
        if (passwordMatch) {
            console.log(`\n  Password (unchanged): ${passwordMatch[1].trim()}`);
        }
        
        console.log(`\n  Note: The fulfillment process overwrites the license_key in-place.`);
        console.log(`  The original key is NOT stored separately unless 'original_key' column exists.`);
    }
}

recoverOriginalKey();
