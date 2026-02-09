/**
 * API endpoint to fetch Amazon orders eligible for Safe-T claims
 * Orders become eligible 50 days after refund date
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Calculate the cutoff date (50 days ago)
        const now = new Date();
        const eligibleCutoff = new Date(now.getTime() - (50 * 24 * 60 * 60 * 1000));
        const approachingCutoff = new Date(now.getTime() - (45 * 24 * 60 * 60 * 1000));

        // Fetch all refunded orders with refunded_at date
        const { data: refundedOrders, error } = await supabase
            .from('amazon_orders')
            .select('*')
            .eq('is_refunded', true)
            .not('refunded_at', 'is', null)
            .order('refunded_at', { ascending: true });

        if (error) throw error;

        const orders = refundedOrders || [];

        // Categorize orders
        const eligible: any[] = [];       // 50+ days (can file Safe-T)
        const approaching: any[] = [];    // 45-49 days (almost eligible)
        const notYetEligible: any[] = []; // < 45 days

        for (const order of orders) {
            const refundedAt = new Date(order.refunded_at);
            const daysSinceRefund = Math.floor((now.getTime() - refundedAt.getTime()) / (24 * 60 * 60 * 1000));
            const daysUntilEligible = 50 - daysSinceRefund;

            const orderWithDays = {
                ...order,
                daysSinceRefund,
                daysUntilEligible: Math.max(0, daysUntilEligible),
                isEligible: daysSinceRefund >= 50,
                eligibleDate: new Date(refundedAt.getTime() + (50 * 24 * 60 * 60 * 1000)).toISOString()
            };

            if (daysSinceRefund >= 50) {
                eligible.push(orderWithDays);
            } else if (daysSinceRefund >= 45) {
                approaching.push(orderWithDays);
            } else {
                notYetEligible.push(orderWithDays);
            }
        }

        return NextResponse.json({
            success: true,
            summary: {
                totalRefunded: orders.length,
                eligible: eligible.length,
                approaching: approaching.length,
                notYetEligible: notYetEligible.length
            },
            eligible,       // Ready to file Safe-T claim
            approaching,    // 45-49 days, almost eligible
            notYetEligible  // Less than 45 days
        });

    } catch (error) {
        console.error('Error fetching Safe-T eligible orders:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch Safe-T eligible orders' },
            { status: 500 }
        );
    }
}
