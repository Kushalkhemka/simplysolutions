/**
 * Find the original username by looking at keys created around the same time
 * Run with: npx tsx scripts/find-original-username.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function findOriginal() {
    // The key was created at 2026-03-26T17:33:19
    // Look at keys created around the same time with OFFICE365 FSN
    const { data: nearbyKeys, error } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, fsn, order_id, created_at')
        .eq('fsn', 'OFFICE365')
        .gte('created_at', '2026-03-26T17:30:00')
        .lte('created_at', '2026-03-26T17:40:00')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`\n📋 Keys created in same batch (around 2026-03-26T17:33):\n`);
    console.log('  #  | License Key (first 50 chars)                         | Order ID');
    console.log('  ' + '-'.repeat(100));
    
    nearbyKeys?.forEach((key, i) => {
        const keyStart = key.license_key?.substring(0, 55) || 'N/A';
        const isTarget = key.id === '257ee388-c246-4196-b7a8-d1e48630cf92';
        const marker = isTarget ? ' ◄ THIS ONE' : '';
        console.log(`  ${(i + 1).toString().padStart(2)}. ${keyStart.padEnd(56)} ${(key.order_id || 'N/A').padEnd(25)}${marker}`);
    });

    // Also specifically check: the password V%693712430115ox — search by password
    console.log('\n\n🔍 Searching by password to find original key...\n');
    const { data: passwordMatch } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, order_id, created_at')
        .ilike('license_key', '%V%693712430115ox%');

    passwordMatch?.forEach((key, i) => {
        console.log(`  ${i + 1}. ID: ${key.id}`);
        console.log(`     Key: ${key.license_key}`);
        console.log(`     Order: ${key.order_id || 'N/A'}`);
        console.log(`     Created: ${key.created_at}`);
        console.log('');
    });

    // Try to find the pattern - look at ms365pro.online keys with number usernames
    console.log('\n🔍 Looking for numbered ms365pro.online keys near the target...\n');
    const { data: numberedKeys } = await supabase
        .from('amazon_activation_license_keys')
        .select('id, license_key, created_at')
        .eq('fsn', 'OFFICE365')
        .ilike('license_key', 'Username:%@ms365pro.online%')
        .gte('created_at', '2026-03-26T17:33:00')
        .lte('created_at', '2026-03-26T17:34:00')
        .order('created_at', { ascending: true })
        .limit(20);

    numberedKeys?.forEach((key, i) => {
        const isTarget = key.id === '257ee388-c246-4196-b7a8-d1e48630cf92';
        const marker = isTarget ? ' ◄◄◄' : '';
        console.log(`  ${(i + 1).toString().padStart(2)}. ${key.license_key?.substring(0, 60)}${marker}`);
    });
}

findOriginal();
