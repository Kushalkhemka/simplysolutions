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
            // If orderId is all digits, try different formats
            const cleanCode = orderId.replace(/\D/g, '');

            // Try to format as standard Amazon order ID (xxx-xxxxxxx-xxxxxxx) if 17+ digits
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

            // If still not found, try a partial match (order_id contains the input)
            if (!order) {
                const { data: partialMatch } = await adminClient
                    .from('amazon_orders')
                    .select('id, order_id, contact_phone, warranty_status')
                    .ilike('order_id', `%${orderId}%`)
                    .maybeSingle();

                if (partialMatch) {
                    order = partialMatch;
                }
            }

            // If still not found and input is digits only, try searching for order_id containing those digits
            if (!order && cleanCode.length >= 10) {
                const { data: digitsMatch } = await adminClient
                    .from('amazon_orders')
                    .select('id, order_id, contact_phone, warranty_status')
                    .ilike('order_id', `%${cleanCode}%`)
                    .maybeSingle();

                if (digitsMatch) {
                    order = digitsMatch;
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
        .eq('type', appealType)
        .maybeSingle();

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

    console.log(`[feedback-appeal] WhatsApp result for ${actualOrderId} to ${phone}:`, {
        success: whatsappResult.success,
        messageId: whatsappResult.messageId,
        error: whatsappResult.error
    });

    return NextResponse.json({
        success: true,
        message: 'Order blocked and WhatsApp sent',
        whatsappSent: whatsappResult.success,
        whatsappError: whatsappResult.error
    });
}

// Approve appeal: Unblock order + send WhatsApp
async function handleApprove(adminClient: ReturnType<typeof getAdminClient>, orderId: string, appealType: AppealType) {
    // 1. Get appeal details (for 'feedback', also match NULL type for legacy records)
    let selectQuery = adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId);
    if (appealType === 'feedback') {
        selectQuery = selectQuery.or('type.eq.feedback,type.is.null');
    } else {
        selectQuery = selectQuery.eq('type', 'review');
    }
    const { data: appeal, error: appealError } = await selectQuery.single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status (use id for precision)
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'APPROVED',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', appeal.id);

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
    // 1. Get appeal details (for 'feedback', also match NULL type for legacy records)
    let selectQuery = adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId);
    if (appealType === 'feedback') {
        selectQuery = selectQuery.or('type.eq.feedback,type.is.null');
    } else {
        selectQuery = selectQuery.eq('type', 'review');
    }
    const { data: appeal, error: appealError } = await selectQuery.single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status (use id for precision)
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'REJECTED',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', appeal.id);

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
    // 1. Get appeal details (for 'feedback', also match NULL type for legacy records)
    let selectQuery = adminClient
        .from('feedback_appeals')
        .select('*')
        .eq('order_id', orderId);
    if (appealType === 'feedback') {
        selectQuery = selectQuery.or('type.eq.feedback,type.is.null');
    } else {
        selectQuery = selectQuery.eq('type', 'review');
    }
    const { data: appeal, error: appealError } = await selectQuery.single();

    if (appealError || !appeal) {
        return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
    }

    // 2. Update appeal status (use id for precision)
    await adminClient
        .from('feedback_appeals')
        .update({
            status: 'RESUBMIT',
            screenshot_url: '',
            reviewed_at: new Date().toISOString()
        })
        .eq('id', appeal.id);

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

// GET appeals list + stats for feedback appeals
export async function GET(request: NextRequest) {
    try {
        const adminClient = getAdminClient();
        const { searchParams } = new URL(request.url);

        const type = searchParams.get('type') || 'feedback';
        const status = searchParams.get('status') || 'all';
        const search = searchParams.get('search') || '';
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

        const typeFilter: AppealType = type === 'review' ? 'review' : 'feedback';
        // For 'feedback' type, also include NULL type for legacy records
        const isFeedback = typeFilter === 'feedback';

        // 1. Fetch stats for this type
        const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'RESUBMIT'] as const;
        const statsPromises = statuses.map(s => {
            let q = adminClient
                .from('feedback_appeals')
                .select('*', { count: 'exact', head: true })
                .eq('status', s);
            if (isFeedback) {
                q = q.or('type.eq.feedback,type.is.null');
            } else {
                q = q.eq('type', 'review');
            }
            return q;
        });
        const statsResults = await Promise.all(statsPromises);

        const stats = {
            pending: statsResults[0].count || 0,
            approved: statsResults[1].count || 0,
            rejected: statsResults[2].count || 0,
            resubmit: statsResults[3].count || 0,
        };

        // 2. Fetch paginated appeals
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = adminClient
            .from('feedback_appeals')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false });

        if (isFeedback) {
            query = query.or('type.eq.feedback,type.is.null');
        } else {
            query = query.eq('type', 'review');
        }

        if (search) {
            query = query.or(`order_id.ilike.%${search}%,phone.ilike.%${search}%`);
        }

        if (status !== 'all') {
            query = query.eq('status', status);
        }

        const { data: appeals, count, error } = await query.range(from, to);

        if (error) {
            console.error('Error fetching appeals:', error);
            return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
        }

        return NextResponse.json({
            appeals: appeals || [],
            totalCount: count || 0,
            stats,
        });
    } catch (error) {
        console.error('Error fetching appeals:', error);
        return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
    }
}


