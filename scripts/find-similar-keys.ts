/**
 * Script to find license keys matching a specific format pattern
 * Base key format: XQCTN-DQJF6-QJW9Q-7CVBW-MTDGY (5 groups of 5 alphanumeric chars)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Base key pattern: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
// Regex to match keys with 5 groups of 5 alphanumeric characters
const WINDOWS_KEY_PATTERN = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

async function findSimilarKeys() {
    console.log('🔍 Searching for license keys matching the pattern: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
    console.log('📋 Base key example: XQCTN-DQJF6-QJW9Q-7CVBW-MTDGY\n');

    try {
        // Fetch all license keys from the amazon_activation_license_keys table
        const { data: keys, error } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn, is_redeemed, order_id, redeemed_at, created_at')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('❌ Error fetching license keys:', error.message);
            process.exit(1);
        }

        if (!keys || keys.length === 0) {
            console.log('📭 No license keys found in the database.');
            return;
        }

        console.log(`📊 Total license keys in database: ${keys.length}\n`);

        // Filter keys matching the Windows product key pattern
        const matchingKeys = keys.filter(key =>
            key.license_key && WINDOWS_KEY_PATTERN.test(key.license_key.toUpperCase())
        );

        if (matchingKeys.length === 0) {
            console.log('❌ No license keys matching the Windows format found.');
            return;
        }

        console.log(`✅ Found ${matchingKeys.length} keys matching the format:\n`);
        console.log('='.repeat(90));
        console.log(
            'License Key'.padEnd(32) +
            'FSN'.padEnd(25) +
            'Redeemed'.padEnd(12) +
            'Created At'
        );
        console.log('='.repeat(90));

        // Group by FSN and redeemed status for summary
        const fsnCounts: Record<string, number> = {};
        const redeemedCounts = { redeemed: 0, available: 0 };

        for (const key of matchingKeys) {
            const licenseKey = key.license_key || 'N/A';
            const fsn = key.fsn || 'N/A';
            const isRedeemed = key.is_redeemed ? 'Yes' : 'No';
            const createdAt = key.created_at
                ? new Date(key.created_at).toLocaleDateString()
                : 'N/A';

            console.log(
                licenseKey.padEnd(32) +
                fsn.padEnd(25) +
                isRedeemed.padEnd(12) +
                createdAt
            );

            fsnCounts[fsn] = (fsnCounts[fsn] || 0) + 1;
            if (key.is_redeemed) {
                redeemedCounts.redeemed++;
            } else {
                redeemedCounts.available++;
            }
        }

        console.log('\n' + '='.repeat(90));
        console.log('\n📈 Summary by FSN (Product Type):');
        for (const [fsn, count] of Object.entries(fsnCounts).sort((a, b) => b[1] - a[1])) {
            console.log(`   ${fsn}: ${count}`);
        }

        console.log('\n📊 Summary by Redemption Status:');
        console.log(`   Available: ${redeemedCounts.available}`);
        console.log(`   Redeemed: ${redeemedCounts.redeemed}`);

    } catch (err) {
        console.error('❌ Unexpected error:', err);
        process.exit(1);
    }
}

findSimilarKeys();
