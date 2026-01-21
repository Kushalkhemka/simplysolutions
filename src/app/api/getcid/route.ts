import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const GETCID_TOKEN = '4aiw4hbq5da';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface GetCidRequest {
    identifier: string;
    installationId: string;
}

// Parse API response status
function parseApiStatus(response: string): string {
    if (/^\d{48}$/.test(response.trim())) return 'success';
    if (response.includes('Wrong IID')) return 'wrong_iid';
    if (response.includes('Blocked IID')) return 'blocked_iid';
    if (response.includes('Exceeded IID')) return 'exceeded_iid';
    if (response.includes('Need to call')) return 'call_support';
    if (response.includes('Not legimate') || response.includes('Maybe blocked')) return 'blocked_key';
    if (response.includes('IP reach request limit') || response.includes('IP is being locked')) return 'ip_blocked';
    if (response.includes('IID reach request limit') || response.includes('IID is being locked')) return 'iid_blocked';
    if (response.includes('Token')) return 'token_error';
    if (response.includes('Server too busy')) return 'server_busy';
    return 'error';
}

export async function POST(request: NextRequest) {
    try {
        const body: GetCidRequest = await request.json();
        const { identifier, installationId } = body;

        if (!identifier || !installationId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate Installation ID format (63 digits)
        const cleanIid = installationId.replace(/\s/g, '');
        if (!/^\d{63}$/.test(cleanIid)) {
            return NextResponse.json({ error: 'Invalid Installation ID. Must be 63 digits.' }, { status: 400 });
        }

        // Check if order exists and if GetCID was already used
        // Identifier can be either:
        // - order_id (Digital: 15-17 digit secret code)
        // - amazon_order_id (FBA: XXX-XXXXXXX-XXXXXXX format)
        const cleanIdentifier = identifier.trim();
        const isSecretCode = /^\d{15,17}$/.test(cleanIdentifier);
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanIdentifier);

        if (!isSecretCode && !isAmazonOrderId) {
            return NextResponse.json({
                error: 'Invalid format. Please enter a 15-digit secret code OR Amazon Order ID (e.g., 408-1234567-1234567).'
            }, { status: 400 });
        }

        // Search by order_id for both secret codes and Amazon Order IDs
        // since both are stored in the order_id field
        const { data: order } = await supabase
            .from('amazon_orders')
            .select('id, order_id, getcid_used')
            .eq('order_id', cleanIdentifier)
            .single();

        if (!order) {
            return NextResponse.json({
                error: isAmazonOrderId
                    ? 'Amazon Order ID not found. Please check your order ID.'
                    : 'Invalid secret code. Please check and try again.'
            }, { status: 404 });
        }

        if (order.getcid_used) {
            return NextResponse.json({
                error: 'This code has already been used for Confirmation ID generation. Please contact support if you need assistance.'
            }, { status: 403 });
        }

        // Call GetCID API
        const apiUrl = `https://getcid.info/api/${cleanIid}/${GETCID_TOKEN}`;
        const apiResponse = await fetch(apiUrl);
        const responseText = await apiResponse.text();
        const trimmedResponse = responseText.trim();

        const apiStatus = parseApiStatus(trimmedResponse);
        const isSuccess = apiStatus === 'success';

        // Get client IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || 'unknown';

        // Log the usage
        await supabase.from('getcid_usage').insert({
            identifier,
            identifier_type: /^\d{15,17}$/.test(identifier) ? 'secret_code' : 'order_id',
            installation_id: cleanIid,
            confirmation_id: isSuccess ? trimmedResponse : null,
            api_response: trimmedResponse,
            api_status: apiStatus,
            ip_address: ip !== 'unknown' ? ip : null,
            user_agent: request.headers.get('user-agent')
        });

        // Mark as used ONLY on success
        if (isSuccess) {
            // Update using order_id
            await supabase
                .from('amazon_orders')
                .update({ getcid_used: true, getcid_used_at: new Date().toISOString() })
                .eq('order_id', cleanIdentifier);

            return NextResponse.json({
                success: true,
                confirmationId: trimmedResponse,
                message: 'Confirmation ID generated successfully!'
            });
        }

        // Return appropriate error message
        const errorMessages: Record<string, string> = {
            wrong_iid: 'Invalid Installation ID. Please check and try again.',
            blocked_iid: 'This Installation ID has been blocked.',
            exceeded_iid: 'This Installation ID has exceeded usage limits.',
            call_support: 'This product requires phone activation. Please call Microsoft Support.',
            blocked_key: 'This product key may be blocked. Please contact support.',
            ip_blocked: 'Too many requests. Please try again later.',
            iid_blocked: 'This Installation ID has too many requests. Please try again later.',
            token_error: 'Service configuration error. Please contact support.',
            server_busy: 'Server is busy. Please try again in a few minutes.',
            error: 'An error occurred. Please try again.'
        };

        return NextResponse.json({
            success: false,
            error: errorMessages[apiStatus] || errorMessages.error,
            canRetry: ['wrong_iid', 'server_busy', 'ip_blocked'].includes(apiStatus)
        });

    } catch (error) {
        console.error('GetCID API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
