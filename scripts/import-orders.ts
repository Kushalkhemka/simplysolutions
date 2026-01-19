/**
 * Import Historical Orders from CSV
 * Imports orders from export_All-Orders CSV into amazon_orders table
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface CsvOrder {
    activationKey: string;
    confirmationId: string;
    contact: string;
    fsn: string;
    inWarranty: boolean;
    installationId: string;
    orderId: string;
}

function parseCSVLine(line: string): string[] {
    const parts: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            parts.push(current);
            current = '';
        } else {
            current += char;
        }
    }
    parts.push(current);
    return parts;
}

function parseCSV(csvPath: string): CsvOrder[] {
    const content = fs.readFileSync(csvPath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header
    const orders: CsvOrder[] = [];

    for (const line of lines) {
        if (!line.trim()) continue;

        const parts = parseCSVLine(line);
        if (parts.length < 7) continue;

        const activationKey = parts[0].trim();
        const confirmationId = parts[1].trim();
        const contact = parts[2].trim();
        const fsn = parts[3].trim();
        const inWarranty = parts[4].trim().toLowerCase() === 'yes';
        const installationId = parts[5].trim();
        const orderId = parts[6].trim();

        // Skip if no order ID
        if (!orderId) continue;

        orders.push({
            activationKey,
            confirmationId,
            contact,
            fsn,
            inWarranty,
            installationId,
            orderId
        });
    }

    return orders;
}

async function importOrders() {
    const csvPath = path.join(__dirname, '../exported_data_csv/export_All-Orders_2026-01-18_08-23-53.csv');

    console.log('=== Import Historical Orders ===\n');
    console.log(`Reading CSV: ${csvPath}`);

    const csvOrders = parseCSV(csvPath);
    console.log(`Found ${csvOrders.length} orders in CSV`);

    if (csvOrders.length === 0) {
        console.log('No orders to import');
        return;
    }

    // Get existing order IDs
    const { data: existingOrders } = await supabase
        .from('amazon_orders')
        .select('order_id');

    const existingSet = new Set((existingOrders || []).map(o => o.order_id));
    const newOrders = csvOrders.filter(o => !existingSet.has(o.orderId));

    console.log(`Existing in DB: ${existingSet.size}`);
    console.log(`New to import: ${newOrders.length}`);

    if (newOrders.length === 0) {
        console.log('No new orders to import');
        return;
    }

    // Deduplicate newOrders by order_id (keep first occurrence)
    const uniqueOrders = new Map<string, typeof newOrders[0]>();
    for (const order of newOrders) {
        if (!uniqueOrders.has(order.orderId)) {
            uniqueOrders.set(order.orderId, order);
        }
    }
    const dedupedOrders = Array.from(uniqueOrders.values());
    console.log(`After deduplication: ${dedupedOrders.length} unique orders`);

    // Import in batches
    const BATCH_SIZE = 500;
    let imported = 0;

    for (let i = 0; i < dedupedOrders.length; i += BATCH_SIZE) {
        const batch = dedupedOrders.slice(i, i + BATCH_SIZE);

        const ordersToInsert = batch.map(o => ({
            order_id: o.orderId,
            fsn: o.fsn,
            fulfillment_type: 'amazon_mfn',
            getcid_used: !!o.confirmationId,
            confirmation_id: o.confirmationId ? o.confirmationId.substring(0, 100) : null,
        }));

        const { error } = await supabase
            .from('amazon_orders')
            .insert(ordersToInsert);

        if (error) {
            console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
        } else {
            imported += batch.length;
            console.log(`Imported ${imported}/${newOrders.length} orders...`);
        }
    }

    console.log(`\n✓ Imported ${imported} orders`);

    // Stats by FSN
    const byFsn = new Map<string, number>();
    for (const o of newOrders) {
        byFsn.set(o.fsn, (byFsn.get(o.fsn) || 0) + 1);
    }
    console.log('\nImported by FSN (top 10):');
    [...byFsn.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .forEach(([fsn, count]) => console.log(`  ${fsn}: ${count} orders`));
}

importOrders().catch(console.error);
