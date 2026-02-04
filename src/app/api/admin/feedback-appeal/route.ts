import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import {
    sendFeedbackRemovalRequest,
    sendFeedbackAppealApproved,
    sendFeedbackAppealRejected,
    sendFeedbackAppealResubmit,
    sendReviewRemovalRequest,
    sendReviewAppealApproved,
    sendReviewAppealRejected,
    sendReviewAppealResubmit,
    type WhatsAppResponse
} from '@/lib/whatsapp';

type AppealType = 'feedback' | 'review';

// POST /api/admin/feedback-appeal
// Handle feedback/review appeal actions: initiate, approve, reject, resubmit
export async function POST(request: NextRequest) {
    try {
        const { orderId, phone, action, type = 'feedback' } = await request.json();

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const appealType: AppealType = type === 'review' ? 'review' : 'feedback';
        const adminClient = getAdminClient();

        switch (action) {
            case 'initiate':
                return handleInitiate(adminClient, orderId, phone, appealType);
            case 'approve':
                return handleApprove(adminClient, orderId, appealType);
            case 'reject':
                return handleReject(adminClient, orderId, appealType);
            case 'resubmit':
                return handleResubmit(adminClient, orderId, appealType);
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }
    } catch (error) {
        console.error('Feedback appeal admin error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Initiate feedback/review removal process: Block order + send WhatsApp
async function handleInitiate(adminClient: ReturnType<typeof getAdminClient>, orderId: string, phone: string, appealType: AppealType) {
    if (!phone) {
        return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 1. Get order details - try multiple formats
    // Amazon orders are stored with dashes (xxx-xxxxxxx-xxxxxxx) but users might enter without
    let order = null;

    // Try exact match first
    const { data: exactMatch, error: exactError } = await adminClient
        .from('amazon_orders')
        .select('id, order_id, contact_phone, warranty_status')
        .eq('order_id', orderId)
        .maybeSingle();

    console.log(`[feedback-appeal] Query for "${orderId}": data=${JSON.stringify(exactMatch)}, error=${JSON.stringify(exactError)}`);

    if (exactMatch) {
        order = exactMatch;
    } else {
        // Try case-insensitive match
        const { data: ilikeMatch } = await adminClient
            .from('amazon_orders')
            .select('id, order_id, contact_phone, warranty_status')
            .ilike('order_id', orderId)
            .maybeSingle();

        if (ilikeMatch) {
            order = ilikeMatch;
        } else {
            // If orderId is all digits, try to format as Amazon order ID (xxx-xxxxxxx-xxxxxxx)
            const cleanCode = orderId.replace(/\D/g, '');
            if (cleanCode.length >= 17) {
                const formattedOrderId = `${cleanCode.slice(0, 3)}-${cleanCode.slice(3, 10)}-${cleanCode.slice(10, 17)}`;
                const { data: formattedMatch } = await adminClient
                    .from('amazon_orders')
                    .select('id, order_id, contact_phone, warranty_status')
                    .eq('order_id', formattedOrderId)
                    .maybeSingle();

                if (formattedMatch) {
                    order = formattedMatch;
                }
            }
        }
    }

    if (!order) {
        // Log what we tried for debugging
        console.error(`[feedback-appeal] Order not found. Tried: exact="${orderId}", formatted="${orderId.replace(/\D/g, '').length >= 17 ? `${orderId.replace(/\D/g, '').slice(0, 3)}-${orderId.replace(/\D/g, '').slice(3, 10)}-${orderId.replace(/\D/g, '').slice(10, 17)}` : 'N/A'}"`);
        return NextResponse.json({
            error: 'Order not found in database',
            searched: orderId,
            hint: 'This order may not have been synced yet. Check Amazon Orders page to verify it exists.'
        }, { status: 404 });
    }

    // 2. Block the order (use matched order's order_id)
    const actualOrderId = order.order_id;
    const { error: blockError } = await adminClient
        .from('amazon_orders')
        .update({ warranty_status: 'BLOCKED' })
        .eq('order_id', actualOrderId);

    if (blockError) {
        console.error('Error blocking order:', blockError);
        return NextResponse.json({ error: 'Failed to block order' }, { status: 500 });
    }

    // 3. Create or update feedback appeal record
    const { data: existingAppeal } = await adminClient
        .from('feedback_appeals')
        .select('id')
        .eq('order_id', actualOrderId)
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
                initiated_by: 'admin',
                type: appealType
            })
            .eq('id', existingAppeal.id);
    } else {
        // Create new
        await adminClient
            .from('feedback_appeals')
            .insert({
                order_id: actualOrderId,
                status: 'PENDING',
                phone: phone,
                screenshot_url: '',
                reminder_count: 1,
                last_reminder_at: new Date().toISOString(),
                whatsapp_sent: true,
                initiated_by: 'admin',
                type: appealType
            });
    }

    // 4. Send WhatsApp notification based on type
    const whatsappResult = appealType === 'review'
        ? await sendReviewRemovalRequest(phone, actualOrderId)
        : await sendFeedbackRemovalRequest(phone, actualOrderId);

    return NextResponse.json({
        success: true,
        message: 'Order blocked and WhatsApp sent',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Approve appeal: Unblock order + send WhatsApp
async function handleApprove(adminClient: ReturnType<typeof getAdminClient>, orderId: string, appealType: AppealType) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .eq('type', appealType)
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
        .eq('order_id', orderId)
        .eq('type', appealType);

    // 3. Unblock the order (set to null or a normal status)
    await adminClient
        .from('amazon_orders')
        .update({ warranty_status: null })
        .eq('order_id', orderId);

    // 4. Send WhatsApp notification based on type
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = appealType === 'review'
            ? await sendReviewAppealApproved(appeal.phone, orderId)
            : await sendFeedbackAppealApproved(appeal.phone, orderId);
    }

    return NextResponse.json({
        success: true,
        message: 'Appeal approved, order unblocked',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Reject appeal: Keep blocked + send WhatsApp
async function handleReject(adminClient: ReturnType<typeof getAdminClient>, orderId: string, appealType: AppealType) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .eq('type', appealType)
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
        .eq('order_id', orderId)
        .eq('type', appealType);

    // 3. Send WhatsApp notification based on type
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = appealType === 'review'
            ? await sendReviewAppealRejected(appeal.phone, orderId)
            : await sendFeedbackAppealRejected(appeal.phone, orderId);
    }

    return NextResponse.json({
        success: true,
        message: 'Appeal rejected, order remains blocked',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Request resubmission: Reset to pending + send WhatsApp
async function handleResubmit(adminClient: ReturnType<typeof getAdminClient>, orderId: string, appealType: AppealType) {
    // 1. Get appeal details
    const { data: appeal, error: appealError } = await adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId)
        .eq('type', appealType)
        .single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'RESUBMIT',
            screenshot_url: '',
            reviewed_at: new Date().toISOString()
        })
        .eq('order_id', orderId)
        .eq('type', appealType);

    // 3. Send WhatsApp notification based on type
    let whatsappResult: WhatsAppResponse = { success: false, error: 'No phone number' };
    if (appeal.phone) {
        whatsappResult = appealType === 'review'
            ? await sendReviewAppealResubmit(appeal.phone, orderId)
            : await sendFeedbackAppealResubmit(appeal.phone, orderId);
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

