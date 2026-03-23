/**
 * Query Amazon orders created in February 2026
 * Run with: npx tsx scripts/query-february-orders.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function queryFebruaryOrders() {
    const startDate = '2026-02-01T00:00:00';
    const endDate = '2026-03-01T00:00:00';

    // Get total count
    const { count: totalCount, error: countError } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lt('created_at', endDate);

    if (countError) {
        console.error('Error getting count:', countError);
        return;
    }

    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  AMAZON ORDERS — FEBRUARY 2026');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log(`  Total Orders: ${totalCount}`);
    console.log('');

    // Get breakdown by FSN
    const { data: allOrders, error: fetchError } = await supabase
        .from('amazon_orders')
        .select('order_id, fsn, fulfillment_type, warranty_status, contact_email, contact_phone, license_key_id, is_refunded, getcid_used, created_at')
        .gte('created_at', startDate)
        .lt('created_at', endDate)
        .order('created_at', { ascending: false });

    if (fetchError) {
        console.error('Error fetching orders:', fetchError);
        return;
    }

    if (!allOrders || allOrders.length === 0) {
        console.log('  No orders found in February 2026.');
        return;
    }

    // FSN breakdown
    const fsnBreakdown: Record<string, number> = {};
    const typeBreakdown: Record<string, number> = {};
    let redeemedCount = 0;
    let refundedCount = 0;
    let getcidUsedCount = 0;

    allOrders.forEach(order => {
        const fsn = order.fsn || 'No FSN';
        fsnBreakdown[fsn] = (fsnBreakdown[fsn] || 0) + 1;

        const type = order.fulfillment_type || 'Unknown';
        typeBreakdown[type] = (typeBreakdown[type] || 0) + 1;

        if (order.license_key_id) redeemedCount++;
        if (order.is_refunded) refundedCount++;
        if (order.getcid_used) getcidUsedCount++;
    });

    console.log('  📊 Breakdown by FSN:');
    Object.entries(fsnBreakdown)
        .sort((a, b) => b[1] - a[1])
        .forEach(([fsn, count]) => {
            console.log(`     ${fsn}: ${count}`);
        });
    console.log('');

    console.log('  📦 Breakdown by Fulfillment Type:');
    Object.entries(typeBreakdown).forEach(([type, count]) => {
        const label = type === 'amazon_fba' ? 'FBA' : type === 'amazon_mfn' ? 'Digital/MFN' : type;
        console.log(`     ${label}: ${count}`);
    });
    console.log('');

    console.log('  📈 Stats:');
    console.log(`     Redeemed: ${redeemedCount} / ${allOrders.length}`);
    console.log(`     Refunded: ${refundedCount}`);
    console.log(`     GetCID Used: ${getcidUsedCount}`);
    console.log('');

    console.log('───────────────────────────────────────────────────────────────');
    console.log('  ORDER LIST');
    console.log('───────────────────────────────────────────────────────────────');
    allOrders.forEach((order, i) => {
        const date = new Date(order.created_at).toLocaleString('en-IN', {
            day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
        const type = order.fulfillment_type === 'amazon_fba' ? 'FBA' : 'Digital';
        const redeemed = order.license_key_id ? '✓' : '✗';
        const refunded = order.is_refunded ? ' 💰REFUNDED' : '';
        console.log(`  ${i + 1}. ${order.order_id} | ${order.fsn || 'No FSN'} | ${type} | ${order.warranty_status} | Key: ${redeemed}${refunded} | ${date}`);
    });

    console.log('');
    console.log('═══════════════════════════════════════════════════════════════');
}

queryFebruaryOrders();
