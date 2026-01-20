import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { order_id, customer_email, customer_phone, issue_type } = body;

        if (!order_id) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        if (!customer_email && !customer_phone) {
            return NextResponse.json({ error: 'Email or phone number is required' }, { status: 400 });
        }

        // Get client IP
        const forwarded = request.headers.get('x-forwarded-for');
        const ip = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || 'unknown';

        // Check if IP is blocked
        const { data: blocked } = await supabase
            .from('blocked_ips')
            .select('id')
            .eq('ip_address', ip)
            .single();

        if (blocked) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Check if order exists
        const { data: order } = await supabase
            .from('amazon_orders')
            .select('id, has_activation_issue')
            .eq('order_id', order_id)
            .single();

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        // Update the order with activation issue
        const { error } = await supabase
            .from('amazon_orders')
            .update({
                has_activation_issue: true,
                issue_status: 'pending',
                contact_email: customer_email || null,
                contact_phone: customer_phone || null,
                issue_created_at: order.has_activation_issue ? undefined : new Date().toISOString(),
                last_access_ip: ip,
            })
            .eq('id', order.id);

        if (error) {
            console.error('Error logging activation issue:', error);
            return NextResponse.json({ error: 'Failed to log issue' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Your request has been logged. We will notify you when the key is available.',
        });

    } catch (error) {
        console.error('Error in activation issues API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
