import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * N8N Replacement Request Endpoint
 * 
 * POST /api/n8n/replacement-request
 * 
 * This endpoint is called by the n8n AI agent to initiate a replacement request.
 * It checks for existing requests and returns a link for the customer to upload
 * their error screenshot.
 * 
 * Request:
 * {
 *   "orderId": "408-1234567-1234567",
 *   "issueDescription": "Brief description of the issue",
 *   "apiKey": "required API key for authentication"
 * }
 * 
 * Returns:
 * - If no pending request: Upload link for customer
 * - If pending request exists: Status of existing request
 * - If approved request: New license key details
 */
export async function POST(request: NextRequest) {
    try {
        const { orderId, issueDescription, apiKey } = await request.json();

        // Verify API key (REQUIRED)
        const expectedApiKey = process.env.N8N_API_KEY;

        if (!expectedApiKey) {
            console.error('N8N_API_KEY environment variable not set');
            return NextResponse.json({
                success: false,
                error: 'Server configuration error. N8N_API_KEY not configured.'
            }, { status: 500 });
        }

        if (!apiKey) {
            return NextResponse.json({
                success: false,
                error: 'API key is required. Include apiKey in request body.'
            }, { status: 401 });
        }

        if (apiKey !== expectedApiKey) {
            return NextResponse.json({
                success: false,
                error: 'Invalid API key'
            }, { status: 401 });
        }

        if (!orderId) {
            return NextResponse.json({
                success: false,
                error: 'Order ID is required'
            }, { status: 400 });
        }

        // Clean the input
        const cleanOrderId = orderId.toString().trim().replace(/\s/g, '');

        // Validate format
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanOrderId);
        const isSecretCode = /^\d{14,17}$/.test(cleanOrderId);

        if (!isAmazonOrderId && !isSecretCode) {
            return NextResponse.json({
                success: false,
                error: 'Invalid format. Expected Amazon Order ID (XXX-XXXXXXX-XXXXXXX) or 14-17 digit secret code.'
            }, { status: 400 });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Check if order exists
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn, contact_email, buyer_email')
            .eq('order_id', cleanOrderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                success: false,
                orderFound: false,
                error: 'Order not found in our system. Please verify the order ID.',
                message: 'The order ID provided does not exist in our database. Please double-check the order ID.'
            }, { status: 404 });
        }

        // Check for existing replacement requests
        const { data: existingRequests, error: reqError } = await supabase
            .from('license_replacement_requests')
            .select(`
                id,
                status,
                customer_email,
                admin_notes,
                created_at,
                reviewed_at,
                new_license_key_id
            `)
            .eq('order_id', cleanOrderId)
            .order('created_at', { ascending: false });

        // Check for PENDING request
        const pendingRequest = existingRequests?.find(r => r.status === 'PENDING');
        if (pendingRequest) {
            return NextResponse.json({
                success: true,
                orderFound: true,
                hasPendingRequest: true,
                status: 'PENDING',
                message: 'A replacement request is already PENDING for this order.',
                details: {
                    requestedAt: pendingRequest.created_at,
                    customerEmail: pendingRequest.customer_email,
                    estimatedResponse: '12-24 working hours'
                },
                customerMessage: `Your replacement request is already being reviewed. You will receive the replacement key on your email (${pendingRequest.customer_email}) or you can check at simplysolutions.co.in/activate after 12-24 working hours.`
            });
        }

        // Check for APPROVED request (most recent)
        const approvedRequest = existingRequests?.find(r => r.status === 'APPROVED');
        if (approvedRequest) {
            // Get new license key
            let newLicenseKey = null;
            if (approvedRequest.new_license_key_id) {
                const { data: keyData } = await supabase
                    .from('amazon_activation_license_keys')
                    .select('license_key')
                    .eq('id', approvedRequest.new_license_key_id)
                    .single();
                newLicenseKey = keyData?.license_key;
            }

            return NextResponse.json({
                success: true,
                orderFound: true,
                hasPendingRequest: false,
                hasApprovedRequest: true,
                status: 'APPROVED',
                message: 'A replacement request was already APPROVED for this order.',
                details: {
                    approvedAt: approvedRequest.reviewed_at,
                    newLicenseKey: newLicenseKey,
                    adminNotes: approvedRequest.admin_notes
                },
                customerMessage: newLicenseKey
                    ? `Great news! Your replacement was already approved. Your new license key is: ${newLicenseKey}. You can also check at simplysolutions.co.in/activate with your order ID.`
                    : 'Your replacement was approved. Please check your email or visit simplysolutions.co.in/activate with your order ID.'
            });
        }

        // Check for REJECTED request (inform but allow new request)
        const rejectedRequest = existingRequests?.find(r => r.status === 'REJECTED');

        // No pending/approved request - provide upload link
        const uploadLink = `https://simplysolutions.co.in/replacement-upload/${cleanOrderId}`;

        return NextResponse.json({
            success: true,
            orderFound: true,
            hasPendingRequest: false,
            hasApprovedRequest: false,
            hasRejectedRequest: !!rejectedRequest,
            status: 'NO_REQUEST',
            message: 'No pending replacement request found. Customer can submit a new request.',
            uploadLink: uploadLink,
            rejectedInfo: rejectedRequest ? {
                rejectedAt: rejectedRequest.reviewed_at,
                reason: rejectedRequest.admin_notes || 'No reason provided'
            } : null,
            instructions: [
                `1. Ask the customer to visit: ${uploadLink}`,
                '2. They need to take a screenshot of the error they are facing',
                '3. Upload the screenshot on the page',
                '4. Enter their email address where they will receive the replacement key',
                '5. Once submitted, the request will be reviewed within 12-24 working hours',
                '6. The replacement key will be sent to their email OR they can check at simplysolutions.co.in/activate'
            ],
            customerMessage: `Please visit ${uploadLink} to submit your replacement request. You will need to:\n\n1. Upload a screenshot of the error\n2. Enter your email address\n\nOnce submitted, you will receive your replacement key within 12-24 working hours via email, or you can check at simplysolutions.co.in/activate with your Order ID.`
        });

    } catch (error) {
        console.error('N8N replacement-request error:', error);
        return NextResponse.json({
            success: false,
            error: 'Internal server error',
            message: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
