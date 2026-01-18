// Script to add test license keys to products and assign them to existing order items
// Run with: npx tsx scripts/add-test-license-keys.ts

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function main() {
    console.log('Adding test license keys...\n');

    // Get all order items
    const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('id, product_id, product_name, quantity, order_id, license_keys');

    if (orderItemsError) {
        console.error('Error fetching order items:', orderItemsError);
        return;
    }

    // Filter to items without license keys (null or empty array)
    const itemsWithoutKeys = (orderItems || []).filter(
        (item) => !item.license_keys || item.license_keys.length === 0
    );

    console.log(`Found ${itemsWithoutKeys.length} order items without license keys\n`);

    for (const item of itemsWithoutKeys) {
        console.log(`Processing: ${item.product_name} (qty: ${item.quantity})`);

        const keys: string[] = [];
        const keyIds: string[] = [];

        // Generate and insert license keys
        for (let i = 0; i < item.quantity; i++) {
            const licenseKey = generateLicenseKey();

            const { data: insertedKey, error: insertError } = await supabase
                .from('license_keys')
                .insert({
                    product_id: item.product_id,
                    license_key: licenseKey,
                    status: 'sold',
                    order_id: item.order_id,
                    order_item_id: item.id,
                    sold_at: new Date().toISOString(),
                })
                .select('id, license_key')
                .single();

            if (insertError) {
                console.error(`  Error inserting key: ${insertError.message}`);
                continue;
            }

            keys.push(insertedKey.license_key);
            keyIds.push(insertedKey.id);
            console.log(`  Added key: ${licenseKey}`);
        }

        // Update order item with the license keys
        if (keys.length > 0) {
            const { error: updateError } = await supabase
                .from('order_items')
                .update({
                    license_keys: keys,
                    license_key_ids: keyIds,
                    status: 'delivered',
                })
                .eq('id', item.id);

            if (updateError) {
                console.error(`  Error updating order item: ${updateError.message}`);
            } else {
                console.log(`  ✓ Updated order item with ${keys.length} license key(s)\n`);
            }
        }
    }

    console.log('\nDone!');
}

function generateLicenseKey(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const segments = 5;
    const segmentLength = 5;
    const parts: string[] = [];

    for (let s = 0; s < segments; s++) {
        let part = '';
        for (let i = 0; i < segmentLength; i++) {
            part += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        parts.push(part);
    }

    return parts.join('-');
}

main().catch(console.error);
