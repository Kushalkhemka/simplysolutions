import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_id } = body;

        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

        // Check if IP is blocked
        const { data: blockedIP } = await supabase
            .from('blocked_ips')
            .select('id, reason')
            .eq('ip_address', ip)
            .single();

        if (blockedIP) {
            return NextResponse.json({
                blocked: true,
                reason: 'Access denied from this IP address.',
            });
        }

        // Check if order is marked as fraud
        if (order_id) {
            const { data: amazonOrder } = await supabase
                .from('amazon_orders')
                .select('is_fraud, fraud_reason')
                .eq('order_id', order_id)
                .single();

            if (amazonOrder?.is_fraud) {
                return NextResponse.json({
                    blocked: true,
                    reason: 'This order has been flagged and cannot be activated.',
                });
            }
        }

        return NextResponse.json({
            blocked: false,
        });

    } catch (error) {
        console.error('Error in fraud check API:', error);
        return NextResponse.json({ blocked: false });
    }
}
