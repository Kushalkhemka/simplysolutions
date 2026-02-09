#!/usr/bin/env node

/**
 * Script to insert ASIN to FSN mappings
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://api.simplysolutions.co.in';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_KEY) {
    console.error('Error: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const mappings = [
    { asin: 'B0GM2NYPZW', fsn: 'OFFICE2024-MAC' },
    { asin: 'B0GM2TFCQD', fsn: '365E5' },
    { asin: 'B0GM1XFMDR', fsn: 'OPSG4ZTTK5MMZWPB' },
    { asin: 'B0GM2SHXJJ', fsn: 'PP2016' },
    { asin: 'B0GM2QQB59', fsn: 'OFFICE2024-MAC' },
    { asin: 'B0GM3FSH4H', fsn: 'OFFICE2024-WIN' },
    { asin: 'B0GM2T8FL6', fsn: 'WINDOWS11' },
    { asin: 'B0GM3L6391', fsn: 'OFFICE2024-MAC' },
    { asin: 'B0GJQNVPHD', fsn: 'CHATGPT' },
];

async function main() {
    console.log('=== Inserting ASIN to FSN Mappings ===\n');

    for (const mapping of mappings) {
        const { error } = await supabase
            .from('amazon_asin_mapping')
            .upsert(mapping, { onConflict: 'asin' });

        if (error) {
            console.error(`✗ ${mapping.asin} -> ${mapping.fsn}: ${error.message}`);
        } else {
            console.log(`✓ ${mapping.asin} -> ${mapping.fsn}`);
        }
    }

    console.log('\n=== Done! ===');
}

main().catch(console.error);
