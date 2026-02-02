import { NextRequest, NextResponse } from 'next/server';
import {
    sendFeedbackRemovalRequest,
    sendFeedbackAppealApproved,
    sendFeedbackAppealRejected,
    sendFeedbackAppealResubmit
} from '@/lib/whatsapp';

/**
 * Test endpoint for WhatsApp integration
 * POST /api/test-whatsapp
 * Body: { phone: string, template: string, orderId: string }
 */
export async function POST(request: NextRequest) {
    try {
        const { phone, template, orderId } = await request.json();

        if (!phone || !template || !orderId) {
            return NextResponse.json(
                { error: 'phone, template, and orderId are required' },
                { status: 400 }
            );
        }

        console.log(`Testing WhatsApp: ${template} to ${phone} for order ${orderId}`);

        let result;

        // Use proper helper functions that include all required params
        switch (template) {
            case 'feedback_appeal':
            case 'feedback_removal_request':
                result = await sendFeedbackRemovalRequest(phone, orderId);
                break;
            case 'feedback_appeal_approved':
                result = await sendFeedbackAppealApproved(phone, orderId);
                break;
            case 'feedback_appeal_rejected':
                result = await sendFeedbackAppealRejected(phone, orderId);
                break;
            case 'resubmission_needed':
                result = await sendFeedbackAppealResubmit(phone, orderId);
                break;
            default:
                return NextResponse.json({ error: `Unknown template: ${template}` }, { status: 400 });
        }

        return NextResponse.json({
            success: result.success,
            messageId: result.messageId,
            error: result.error,
            details: {
                phone,
                template,
                orderId
            }
        });
    } catch (error) {
        console.error('WhatsApp test error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
