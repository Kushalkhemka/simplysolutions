import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { verifyMailgunWebhook, parseInboundEmail } from '@/lib/mailgun';

/**
 * Email Refund Webhook
 * 
 * This endpoint receives refund notification emails from Mailgun Inbound Parse
 * and immediately marks the order as refunded.
 * 
 * Setup Instructions:
 * 1. Go to Mailgun Dashboard → Receiving → Routes
 * 2. Create a new route:
 *    - Expression Type: Match Recipient
 *    - Recipient: refunds@your-domain.com (or catch_all for sandbox)
 *    - Actions: Forward → https://simplysolutions.co.in/api/webhooks/email-refund
 *    - Store and Notify
 * 3. Set up Gmail to forward refund emails to: refunds@your-domain.com
 * 
 * Expected email subject format:
 * "Refund Initiated for Order XXX-XXXXXXX-XXXXXXX - Refund Initiated for Order..."
 */

// Webhook secret for verification (set in environment variable)
const WEBHOOK_SECRET = process.env.EMAIL_WEBHOOK_SECRET;

// Amazon order ID regex pattern (XXX-XXXXXXX-XXXXXXX)
const ORDER_ID_PATTERN = /\b(\d{3}-\d{7}-\d{7})\b/g;

interface MailgunInboundPayload {
    sender: string;
    recipient: string;
    subject: string;
    'body-plain'?: string;
    'body-html'?: string;
    timestamp?: string;
}

interface SendGridInboundPayload {
    from: string;
    to: string;
    subject: string;
    text?: string;
    html?: string;
}

interface GmailPubSubPayload {
    message: {
        data: string; // Base64 encoded
        messageId: string;
        publishTime: string;
    };
    subscription: string;
}

/**
 * Extract Amazon order IDs from email subject
 */
function extractOrderIds(subject: string): string[] {
    const matches = subject.match(ORDER_ID_PATTERN);
    if (!matches) return [];

    // Return unique order IDs
    return [...new Set(matches)];
}

/**
 * Verify the webhook request (basic token verification)
 */
function verifyWebhook(request: NextRequest): boolean {
    if (!WEBHOOK_SECRET) {
        // If no secret configured, allow all requests (development mode)
        console.warn('[email-refund] No EMAIL_WEBHOOK_SECRET configured - allowing all requests');
        return true;
    }

    const authHeader = request.headers.get('authorization');
    const queryToken = request.nextUrl.searchParams.get('token');

    return authHeader === `Bearer ${WEBHOOK_SECRET}` || queryToken === WEBHOOK_SECRET;
}

/**
 * Mark orders as refunded in the database
 */
async function markOrdersAsRefunded(orderIds: string[]): Promise<{ marked: number; errors: string[] }> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    let marked = 0;
    const errors: string[] = [];

    for (const orderId of orderIds) {
        try {
            // Check if order exists and is not already refunded
            const { data: order, error: fetchError } = await supabase
                .from('amazon_orders')
                .select('id, order_id, is_refunded')
                .eq('order_id', orderId)
                .maybeSingle();

            if (fetchError) {
                errors.push(`Error fetching ${orderId}: ${fetchError.message}`);
                continue;
            }

            if (!order) {
                console.log(`[email-refund] Order ${orderId} not found in database`);
                continue;
            }

            if (order.is_refunded) {
                console.log(`[email-refund] Order ${orderId} already marked as refunded`);
                continue;
            }

            // Mark as refunded
            // Note: Only updating is_refunded - other columns don't exist yet
            const { error: updateError } = await supabase
                .from('amazon_orders')
                .update({
                    is_refunded: true
                })
                .eq('order_id', orderId);

            if (updateError) {
                errors.push(`Error updating ${orderId}: ${updateError.message}`);
                continue;
            }

            console.log(`[email-refund] ✓ Marked order ${orderId} as refunded via email webhook`);
            marked++;
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Unknown error';
            errors.push(`Exception for ${orderId}: ${message}`);
        }
    }

    return { marked, errors };
}

/**
 * Log webhook request for debugging
 */
async function logWebhookRequest(
    subject: string | null,
    from: string | null,
    orderIds: string[],
    action: string,
    ordersMarked: number,
    contentType: string,
    payloadKeys: string[],
    errorMessage: string | null,
    rawPayload: any
): Promise<void> {
    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        await supabase.from('email_webhook_logs').insert({
            subject,
            from_address: from,
            order_ids: orderIds.length > 0 ? orderIds : null,
            action,
            orders_marked: ordersMarked,
            content_type: contentType,
            payload_keys: payloadKeys,
            error_message: errorMessage,
            raw_payload: rawPayload
        });
    } catch (error) {
        console.error('[email-refund] Failed to log webhook request:', error);
    }
}

/**
 * Parse Mailgun inbound email format
 */

function parseMailgunPayload(body: any): { subject: string; from: string } | null {
    if (body.subject && (body.sender || body.from)) {
        return {
            subject: body.subject,
            from: body.sender || body.from
        };
    }
    return null;
}

/**
 * Parse SendGrid inbound email format
 */
function parseSendGridPayload(body: any): { subject: string; from: string } | null {
    if (body.subject && body.from) {
        return {
            subject: body.subject,
            from: body.from
        };
    }
    return null;
}

/**
 * Parse Gmail Pub/Sub notification format
 * Note: This only tells us an email arrived, we'd need to fetch it via Gmail API
 */
function parseGmailPubSubPayload(body: any): { historyId: string; emailAddress: string } | null {
    if (body.message?.data) {
        try {
            const decoded = JSON.parse(Buffer.from(body.message.data, 'base64').toString());
            return {
                historyId: decoded.historyId,
                emailAddress: decoded.emailAddress
            };
        } catch {
            return null;
        }
    }
    return null;
}

// POST /api/webhooks/email-refund
// Receives refund notification emails and marks orders as refunded
export async function POST(request: NextRequest) {
    try {
        // Verify webhook authenticity
        if (!verifyWebhook(request)) {
            console.error('[email-refund] Webhook verification failed');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Parse request body
        const contentType = request.headers.get('content-type') || '';
        let body: any;

        if (contentType.includes('application/json')) {
            body = await request.json();
        } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
            // Mailgun sends form data
            const formData = await request.formData();
            body = Object.fromEntries(formData.entries());
        } else {
            body = await request.json().catch(() => ({}));
        }

        console.log('[email-refund] Received webhook:', {
            contentType,
            hasSubject: !!body.subject,
            bodyKeys: Object.keys(body)
        });

        // Try to parse as different formats
        let subject = '';
        let from = '';

        // Try Mailgun format
        const mailgunData = parseMailgunPayload(body);
        if (mailgunData) {
            subject = mailgunData.subject;
            from = mailgunData.from;
        }

        // Try SendGrid format
        if (!subject) {
            const sendgridData = parseSendGridPayload(body);
            if (sendgridData) {
                subject = sendgridData.subject;
                from = sendgridData.from;
            }
        }

        // Try direct subject field (generic format)
        if (!subject && body.subject) {
            subject = body.subject;
            from = body.from || body.sender || 'unknown';
        }

        // Check if it's a Gmail Pub/Sub notification (requires additional Gmail API call)
        const gmailData = parseGmailPubSubPayload(body);
        if (gmailData) {
            // For Gmail Pub/Sub, we'd need to implement Gmail API fetch
            // For now, just log and wait for full implementation
            console.log('[email-refund] Gmail Pub/Sub notification received:', gmailData);
            return NextResponse.json({
                success: true,
                type: 'gmail_pubsub',
                message: 'Gmail notification received - full implementation pending',
                historyId: gmailData.historyId
            });
        }

        if (!subject) {
            console.error('[email-refund] No subject found in payload');
            return NextResponse.json({
                error: 'No subject found in email payload',
                receivedKeys: Object.keys(body)
            }, { status: 400 });
        }

        // Check if this is a refund email
        const isRefundEmail = subject.toLowerCase().includes('refund') &&
            subject.toLowerCase().includes('initiated');

        if (!isRefundEmail) {
            console.log('[email-refund] Not a refund email, ignoring:', subject.substring(0, 100));
            // Log anyway for debugging
            await logWebhookRequest(subject, from, [], 'ignored', 0, contentType, Object.keys(body), null, body);
            return NextResponse.json({
                success: true,
                action: 'ignored',
                reason: 'Not a refund email',
                subject: subject.substring(0, 100)
            });
        }

        // Extract order IDs from subject
        const orderIds = extractOrderIds(subject);

        if (orderIds.length === 0) {
            console.log('[email-refund] No order IDs found in refund email:', subject);
            await logWebhookRequest(subject, from, [], 'no_orders_found', 0, contentType, Object.keys(body), null, body);
            return NextResponse.json({
                success: true,
                action: 'no_orders_found',
                subject: subject.substring(0, 100)
            });
        }

        console.log(`[email-refund] Processing refund for ${orderIds.length} order(s):`, orderIds);

        // Mark orders as refunded
        const result = await markOrdersAsRefunded(orderIds);

        // Log successful processing
        await logWebhookRequest(
            subject,
            from,
            orderIds,
            'processed',
            result.marked,
            contentType,
            Object.keys(body),
            result.errors.length > 0 ? result.errors.join('; ') : null,
            body
        );

        return NextResponse.json({
            success: true,
            action: 'processed',
            ordersFound: orderIds.length,
            ordersMarked: result.marked,
            errors: result.errors.length > 0 ? result.errors : undefined
        });

    } catch (error) {
        console.error('[email-refund] Webhook error:', error);
        // Log error (best effort - may also fail)
        try {
            await logWebhookRequest(null, null, [], 'error', 0, '', [], error instanceof Error ? error.message : 'Unknown error', null);
        } catch { } // Silently ignore logging errors
        return NextResponse.json({
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// GET endpoint for testing/verification
export async function GET(request: NextRequest) {
    // Simple test endpoint to verify webhook is accessible
    const testSubject = request.nextUrl.searchParams.get('test_subject');

    if (testSubject) {
        const orderIds = extractOrderIds(testSubject);
        return NextResponse.json({
            success: true,
            message: 'Webhook is active',
            testSubject,
            extractedOrderIds: orderIds
        });
    }

    return NextResponse.json({
        success: true,
        message: 'Email refund webhook is active',
        usage: {
            POST: 'Send email payload with subject containing "Refund Initiated for Order"',
            GET: 'Test extraction: ?test_subject=Refund Initiated for Order 403-8028387-4324316'
        }
    });
}
