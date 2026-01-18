/**
 * Script to link license keys to amazon_orders based on CSV data
 * 
 * The CSV has: "Activation Key", "Confirmation ID", "CONTACT", "FSN", "in_warranty", "Installation ID", "ORDER ID"
 * 
 * This script will:
 * 1. Read the CSV
 * 2. For each row with an Activation Key and Order ID:
 *    - Find or create the license key in amazon_activation_license_keys
 *    - Link it to the order in amazon_orders
 *    - Set getcid_used if Confirmation ID exists
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const supabase = createClient(
    'https://supabase-supabase2.exxngc.easypanel.host',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
);

interface CsvRow {
    activationKey: string;
    confirmationId: string;
    contact: string;
    fsn: string;
    inWarranty: string;
    installationId: string;
    orderId: string;
}

function parseCSV(content: string): CsvRow[] {
    const lines = content.split('\n').filter(l => l.trim());
    const rows: CsvRow[] = [];

    // Skip header
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        // Parse CSV with quoted values
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || [];
        const values = matches.map(v => v.replace(/^"|"$/g, '').trim());

        if (values.length >= 7) {
            rows.push({
                activationKey: values[0] || '',
                confirmationId: values[1] || '',
                contact: values[2] || '',
                fsn: values[3] || '',
                inWarranty: values[4] || '',
                installationId: values[5] || '',
                orderId: values[6] || ''
            });
        }
    }

    return rows;
}

async function linkLicenseKeys() {
    console.log('Reading CSV file...');

    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Orders_2026-01-18_08-23-53.csv');
    const content = fs.readFileSync(csvPath, 'utf-8');
    const rows = parseCSV(content);

    console.log(`Found ${rows.length} rows in CSV`);

    let linked = 0;
    let created = 0;
    let updated = 0;
    let errors = 0;

    for (const row of rows) {
        if (!row.orderId || !row.activationKey) {
            continue;
        }

        const orderId = row.orderId.trim();
        const licenseKey = row.activationKey.replace(/--+$/, '').replace(/----$/, '').trim(); // Remove trailing dashes
        const fsn = row.fsn.trim();
        const confirmationId = row.confirmationId.trim();
        const installationId = row.installationId.trim();

        try {
            // Check if order exists
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('id, license_key_id')
                .eq('order_id', orderId)
                .single();

            if (!order) {
                console.log(`Order not found: ${orderId}`);
                errors++;
                continue;
            }

            // Check if license key already exists
            let { data: existingKey } = await supabase
                .from('amazon_activation_license_keys')
                .select('id')
                .eq('license_key', licenseKey)
                .single();

            let keyId: string;

            if (!existingKey) {
                // Create the license key
                const { data: newKey, error: createError } = await supabase
                    .from('amazon_activation_license_keys')
                    .insert({
                        license_key: licenseKey,
                        fsn: fsn,
                        is_redeemed: true,
                        order_id: orderId
                    })
                    .select('id')
                    .single();

                if (createError || !newKey) {
                    console.log(`Error creating key for ${orderId}:`, createError?.message);
                    errors++;
                    continue;
                }

                keyId = newKey.id;
                created++;
            } else {
                keyId = existingKey.id;

                // Update the key with order_id if not set
                await supabase
                    .from('amazon_activation_license_keys')
                    .update({
                        is_redeemed: true,
                        order_id: orderId,
                        fsn: fsn || undefined
                    })
                    .eq('id', keyId);
            }

            // Determine fulfillment type
            const isDigital = /^\d{15,17}$/.test(orderId);

            // Update the order with license_key_id and other data
            const updateData: any = {
                license_key_id: keyId,
                fulfillment_type: isDigital ? 'amazon_digital' : 'amazon_fba'
            };

            if (confirmationId) {
                updateData.confirmation_id = confirmationId;
                updateData.getcid_used = true;
                updateData.getcid_used_at = new Date().toISOString();
            }

            if (installationId) {
                updateData.installation_id = installationId;
            }

            const { error: updateError } = await supabase
                .from('amazon_orders')
                .update(updateData)
                .eq('id', order.id);

            if (updateError) {
                console.log(`Error updating order ${orderId}:`, updateError.message);
                errors++;
            } else {
                linked++;
            }

        } catch (err: any) {
            console.log(`Error processing ${orderId}:`, err.message);
            errors++;
        }
    }

    console.log('\n=== Summary ===');
    console.log(`Total rows: ${rows.length}`);
    console.log(`Keys created: ${created}`);
    console.log(`Orders linked: ${linked}`);
    console.log(`Errors: ${errors}`);
}

linkLicenseKeys().catch(console.error);
