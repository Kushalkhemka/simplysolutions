import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
    sendFeedbackRemovalRequest,
    sendFeedbackAppealApproved,
    sendFeedbackAppealRejected,
    sendFeedbackAppealResubmit,
    type WhatsAppResponse
} from '@/lib/whatsapp';

// POST /api/admin/feedback-appeal/initiate
// Block order and send initial WhatsApp notification
export async function POST(request: NextRequest) {
    try {
        const { orderId, phone, action } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        switch (action) {
            case 'initiate':
                return handleInitiate(adminClient, orderId, phone);
            case 'approve':
                return handleApprove(adminClient, orderId);
            case 'reject':
                return handleReject(adminClient, orderId);
            case 'resubmit':
                return handleResubmit(adminClient, orderId);
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Feedback appeal admin error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Initiate feedback removal process: Block order + send WhatsApp
async function handleInitiate(adminClient: ReturnType<typeof getAdminClient>, orderId: string, phone: string) {
    if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 1. Get order details
    const { data: order, error: orderError } = await adminClient
        .from('amazon_orders')
        .select('id, order_id, buyer_phone_number, warranty_status')
        .eq('order_id', orderId)
        .single();

    if (orderError || !order) {
        return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // 2. Block the order
    const { error: blockError } = await adminClient
        .from('amazon_orders')
        .update({ warranty_status: 'BLOCKED' })
        .eq('order_id', orderId);

    if (blockError) {
        console.error('Error blocking order:', blockError);
        return NextResponse.json({ error: 'Failed to block order' }, { status: 500 });
    }

    // 3. Create or update feedback appeal record
    const { data: existingAppeal } = await adminClient
        .from('feedback_appeals')
        .select('id')
        .eq('order_id', orderId)
        .single();

    if (existingAppeal) {
        // Update existing
        await adminClient
            .from('feedback_appeals')
            .update({
                status: 'PENDING',
                phone: phone,
                reminder_count: 1,
                last_reminder_at: new Date().toISOString(),
                whatsapp_sent: true,
                initiated_by: 'admin'
            })
            .eq('id', existingAppeal.id);
    } else {
        // Create new
        await adminClient
            .from('feedback_appeals')
            .insert({
                order_id: orderId,
                status: 'PENDING',
                phone: phone,
                screenshot_url: '', // Will be uploaded by customer
                reminder_count: 1,
                last_reminder_at: new Date().toISOString(),
                whatsapp_sent: true,
                initiated_by: 'admin'
            });
    }

    // 4. Send WhatsApp notification
    const whatsappResult = await sendFeedbackRemovalRequest(phone, orderId);

    return NextResponse.json({
        success: true,
        message: 'Order blocked and WhatsApp sent',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Approve appeal: Unblock order + send WhatsApp
async function handleApprove(adminClient: ReturnType<typeof getAdminClient>, orderId: string) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'APPROVED',
            reviewed_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

    // 3. Unblock the order (set to null or a normal status)
    await adminClient
        .from('amazon_orders')
        .update({ warranty_status: null })
        .eq('order_id', orderId);

    // 4. Send WhatsApp notification
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = await sendFeedbackAppealApproved(appeal.phone, orderId);
    }

    return NextResponse.json({
        success: true,
        message: 'Appeal approved, order unblocked',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Reject appeal: Keep blocked + send WhatsApp
async function handleReject(adminClient: ReturnType<typeof getAdminClient>, orderId: string) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status (order stays BLOCKED)
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'REJECTED',
            reviewed_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

    // 3. Send WhatsApp notification
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = await sendFeedbackAppealRejected(appeal.phone, orderId);
    }

    return NextResponse.json({
        success: true,
        message: 'Appeal rejected, order remains blocked',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Request resubmission: Reset to pending + send WhatsApp
async function handleResubmit(adminClient: ReturnType<typeof getAdminClient>, orderId: string) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'RESUBMIT',
            screenshot_url: '', // Clear old screenshot
            reviewed_at: new Date().toISOString()
        })
        .eq('order_id', orderId);

    // 3. Send WhatsApp notification
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = await sendFeedbackAppealResubmit(appeal.phone, orderId);
    }

    return NextResponse.json({
        success: true,
        message: 'Resubmission requested',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// GET stats for feedback appeals
export async function GET() {
    try {
        const adminClient = getAdminClient();

        const { data, error } = await adminClient
            .from('feedback_appeals')
            .select('status')
            .then(result => {
                if (result.error) throw result.error;

                const stats = {
                    pending: 0,
                    approved: 0,
                    rejected: 0,
                    resubmit: 0,
                    total: result.data?.length || 0
                };

                result.data?.forEach(appeal => {
                    switch (appeal.status) {
                        case 'PENDING': stats.pending++; break;
                        case 'APPROVED': stats.approved++; break;
                        case 'REJECTED': stats.rejected++; break;
                        case 'RESUBMIT': stats.resubmit++; break;
                    }
                });

                return { data: stats, error: null };
            });

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error fetching stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
