/**
 * Backfill script to populate installation_id and confirmation_id 
 * in amazon_orders from getcid_usage table for orders that already used GetCID
 * 
 * Run with: npx tsx scripts/backfill-getcid-ids.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillGetcidIds() {
    console.log('Starting backfill of installation_id and confirmation_id...\n');

    // Get all successful GetCID usage records with confirmation IDs
    const { data: usageRecords, error: usageError } = await supabase
        .from('getcid_usage')
        .select('identifier, installation_id, confirmation_id, created_at')
        .eq('api_status', 'success')
        .not('confirmation_id', 'is', null)
        .order('created_at', { ascending: false });

    if (usageError) {
        console.error('Error fetching getcid_usage:', usageError);
        process.exit(1);
    }

    console.log(`Found ${usageRecords?.length || 0} successful GetCID usage records\n`);

    if (!usageRecords || usageRecords.length === 0) {
        console.log('No records to backfill.');
        return;
    }

    // Group by identifier to get the most recent usage for each order
    const latestByIdentifier = new Map<string, { installation_id: string; confirmation_id: string }>();

    for (const record of usageRecords) {
        // Only keep the first (most recent due to ordering) record for each identifier
        if (!latestByIdentifier.has(record.identifier)) {
            latestByIdentifier.set(record.identifier, {
                installation_id: record.installation_id,
                confirmation_id: record.confirmation_id
            });
        }
    }

    console.log(`Processing ${latestByIdentifier.size} unique orders...\n`);

    let updated = 0;
    let skipped = 0;
    let notFound = 0;
    let errors = 0;

    for (const [identifier, data] of latestByIdentifier) {
        // Check if order exists and needs updating
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, installation_id, confirmation_id')
            .eq('order_id', identifier)
            .single();

        if (orderError || !order) {
            // Try ilike match for case-insensitive lookup
            const { data: ilikeOrder } = await supabase
                .from('amazon_orders')
                .select('id, order_id, installation_id, confirmation_id')
                .ilike('order_id', identifier)
                .single();

            if (!ilikeOrder) {
                console.log(`  [NOT FOUND] Order not found: ${identifier}`);
                notFound++;
                continue;
            }
        }

        const targetOrder = order || null;

        if (!targetOrder) {
            notFound++;
            continue;
        }

        // Skip if already has both IDs
        if (targetOrder.installation_id && targetOrder.confirmation_id) {
            skipped++;
            continue;
        }

        // Update the order with the IDs
        const { error: updateError } = await supabase
            .from('amazon_orders')
            .update({
                installation_id: data.installation_id,
                confirmation_id: data.confirmation_id
            })
            .eq('id', targetOrder.id);

        if (updateError) {
            console.log(`  [ERROR] Failed to update ${identifier}: ${updateError.message}`);
            errors++;
        } else {
            console.log(`  [UPDATED] ${identifier}`);
            updated++;
        }
    }

    console.log('\n=== Backfill Complete ===');
    console.log(`Updated: ${updated}`);
    console.log(`Skipped (already has IDs): ${skipped}`);
    console.log(`Not found: ${notFound}`);
    console.log(`Errors: ${errors}`);
}

backfillGetcidIds().catch(console.error);
