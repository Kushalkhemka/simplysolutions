import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Bulk reject warranty claims from 18/01/2026 silently (no notifications)
export async function POST(request: NextRequest) {
    try {
        // Date range for 18 January 2026 in IST (UTC+5:30)
        // IST midnight 18/01/2026 = UTC 17/01/2026 18:30:00
        // IST end of day 18/01/2026 23:59:59 = UTC 18/01/2026 18:29:59
        const startDate = '2026-01-17T18:30:00.000Z';
        const endDate = '2026-01-18T18:29:59.999Z';

        // First, count how many will be affected
        const { count: affectedCount } = await supabase
            .from('warranty_registrations')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'PROCESSING')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (!affectedCount || affectedCount === 0) {
            return NextResponse.json({
                success: true,
                message: 'No matching warranty claims found to reject',
                count: 0
            });
        }

        // Bulk update: set status to REJECTED, no notifications sent
        const { error: updateError } = await supabase
            .from('warranty_registrations')
            .update({
                status: 'REJECTED',
                rejection_reason: 'Auto-rejected: claim date 18/01/2026',
                admin_notes: 'Bulk auto-rejected — no notification sent'
            })
            .eq('status', 'PROCESSING')
            .gte('created_at', startDate)
            .lte('created_at', endDate);

        if (updateError) {
            console.error('Bulk reject error:', updateError);
            return NextResponse.json(
                { error: 'Failed to bulk reject warranty claims' },
                { status: 500 }
            );
        }

        console.log(`[warranty] Bulk rejected ${affectedCount} claims from 18/01/2026 (silent — no notifications)`);

        return NextResponse.json({
            success: true,
            message: `Successfully rejected ${affectedCount} warranty claims from 18/01/2026`,
            count: affectedCount
        });

    } catch (error) {
        console.error('Bulk reject error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
