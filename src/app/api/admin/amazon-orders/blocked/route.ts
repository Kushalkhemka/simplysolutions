/**
 * API endpoint to fetch blocked Amazon orders with their license keys
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Fetch all blocked orders
        const { data: blockedOrders, error } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('warranty_status', 'BLOCKED')
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Supabase error:', error);
            throw error;
        }

        const orders = blockedOrders || [];

        // Fetch license keys for all blocked orders
        const orderIds = orders.map(o => o.order_id).filter(Boolean);
        let licenseKeyMap: Record<string, { license_key: string; fsn: string | null }[]> = {};

        if (orderIds.length > 0) {
            const { data: licenseKeys } = await supabase
                .from('amazon_activation_license_keys')
                .select('order_id, license_key, fsn')
                .in('order_id', orderIds);

            if (licenseKeys) {
                for (const lk of licenseKeys) {
                    if (!licenseKeyMap[lk.order_id]) {
                        licenseKeyMap[lk.order_id] = [];
                    }
                    licenseKeyMap[lk.order_id].push({ license_key: lk.license_key, fsn: lk.fsn });
                }
            }
        }

        // Attach license keys to orders
        const ordersWithKeys = orders.map(order => ({
            ...order,
            licenseKeys: licenseKeyMap[order.order_id] || []
        }));

        return NextResponse.json({
            success: true,
            total: ordersWithKeys.length,
            orders: ordersWithKeys
        });

    } catch (error: any) {
        console.error('Error fetching blocked orders:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to fetch blocked orders',
                details: error?.message || 'Unknown error'
            },
            { status: 500 }
        );
    }
}
