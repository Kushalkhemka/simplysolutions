import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
    sendFeedbackRemovalRequest,
    sendReviewRemovalRequest
} from '@/lib/whatsapp';

// GET /api/admin/whatsapp-logs?orderId=XXX
// Fetch WhatsApp message logs for an order
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const phone = searchParams.get('phone');

        if (!orderId && !phone) {
            return NextResponse.json({ error: 'orderId or phone is required' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        let query = adminClient
            .from('whatsapp_message_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        if (orderId) {
            query = query.eq('order_id', orderId);
        }
        if (phone) {
            query = query.ilike('phone', `%${phone}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching WhatsApp logs:', error);
            return NextResponse.json({ error: 'Failed to fetch logs' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            logs: data || []
        });
    } catch (error) {
        console.error('WhatsApp logs error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// POST /api/admin/whatsapp-logs
// Resend a WhatsApp message
export async function POST(request: NextRequest) {
    try {
        const { orderId, phone, templateType } = await request.json();

        if (!orderId || !phone) {
            return NextResponse.json({ error: 'orderId and phone are required' }, { status: 400 });
        }

        // Determine which template to send based on templateType
        const type = templateType || 'feedback';

        let whatsappResult;
        if (type === 'review') {
            whatsappResult = await sendReviewRemovalRequest(phone, orderId);
        } else {
            whatsappResult = await sendFeedbackRemovalRequest(phone, orderId);
        }

        if (!whatsappResult.success) {
            return NextResponse.json({
                success: false,
                error: whatsappResult.error || 'Failed to send WhatsApp message'
            }, { status: 400 });
        }

        return NextResponse.json({
            success: true,
            message: 'WhatsApp message resent successfully',
            messageId: whatsappResult.messageId
        });
    } catch (error) {
        console.error('WhatsApp resend error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
