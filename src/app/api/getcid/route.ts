import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isComboProduct } from '@/lib/amazon/combo-products';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

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

// Get an available GetCID token from the database
async function getAvailableToken(): Promise<{ token: string; remaining: number } | null> {
    const { data, error } = await supabase.rpc('get_available_getcid_token');

    if (error || !data || data.length === 0) {
        console.error('No available GetCID token:', error);
        return null;
    }

    return { token: data[0].token, remaining: data[0].remaining_uses };
}

// Increment token usage in database
async function incrementTokenUsage(token: string): Promise<boolean> {
    const { data, error } = await supabase.rpc('increment_getcid_token_usage', { p_token: token });

    if (error) {
        console.error('Failed to increment token usage:', error);
        return false;
    }

    return data === true;
}

// Optional: Verify and sync token usage with GetCID API
async function verifyTokenWithApi(token: string): Promise<{ count_used: number; total: number } | null> {
    try {
        const response = await fetch('https://getcid.info/verify-api-token-getcid', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `tokenApi=${token}`,
        });

        const data = await response.json();
        if (data.Status === 'Success' && data.Result) {
            return {
                count_used: Math.floor(data.Result.count_token || 0),
                total: Math.floor(data.Result.total_token || 100),
            };
        }
    } catch (error) {
        console.error('Failed to verify token with API:', error);
    }
    return null;
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
        const cleanIdentifier = identifier.trim().replace(/\s+/g, '');

        // Secret code: 14-17 digits (no hyphens)
        const isSecretCode = /^\d{14,17}$/.test(cleanIdentifier);
        // Amazon Order ID: XXX-XXXXXXX-XXXXXXX (any digits, with hyphens at fixed positions)
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanIdentifier);

        console.log(`GetCID lookup: identifier="${cleanIdentifier}", isSecretCode=${isSecretCode}, isAmazonOrderId=${isAmazonOrderId}`);

        if (!isSecretCode && !isAmazonOrderId) {
            return NextResponse.json({
                error: 'Invalid format. Please enter a 14-17 digit secret code OR Amazon Order ID (e.g., 403-1234567-1234567).'
            }, { status: 400 });
        }

        // Search for order
        let order = null;

        const { data: exactMatch } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, quantity, getcid_used, getcid_count')
            .eq('order_id', cleanIdentifier)
            .single();

        if (exactMatch) {
            order = exactMatch;
        } else {
            const { data: ilikeMatch } = await supabase
                .from('amazon_orders')
                .select('id, order_id, fsn, quantity, getcid_used, getcid_count')
                .ilike('order_id', cleanIdentifier)
                .single();

            if (ilikeMatch) {
                order = ilikeMatch;
            }
        }

        if (!order) {
            console.error(`Order not found: ${cleanIdentifier}, isAmazonOrderId: ${isAmazonOrderId}`);
            return NextResponse.json({
                error: isAmazonOrderId
                    ? 'Amazon Order ID not found. Please check your order ID.'
                    : 'Invalid secret code. Please check and try again.'
            }, { status: 404 });
        }

        // Calculate max uses based on order quantity and product type
        const isCombo = order.fsn ? isComboProduct(order.fsn) : false;
        const orderQuantity = order.quantity || 1;
        const itemsPerOrder = isCombo ? 2 : 1;
        const maxUses = orderQuantity * itemsPerOrder;
        const currentUses = order.getcid_count || 0;

        if (currentUses >= maxUses) {
            return NextResponse.json({
                error: `You have used all ${maxUses} Confirmation ID generation${maxUses > 1 ? 's' : ''} for this order (${orderQuantity} × ${itemsPerOrder} product${itemsPerOrder > 1 ? 's' : ''}). Please contact support if you need assistance.`
            }, { status: 403 });
        }

        // Get an available token from the database
        const tokenInfo = await getAvailableToken();
        if (!tokenInfo) {
            console.error('No GetCID tokens available in database');
            return NextResponse.json({
                error: 'Service temporarily unavailable. Please try again later or contact support.'
            }, { status: 503 });
        }

        console.log(`Using GetCID token: ${tokenInfo.token.substring(0, 4)}... (${tokenInfo.remaining} remaining)`);

        // Call GetCID API
        const apiUrl = `https://getcid.info/api/${cleanIid}/${tokenInfo.token}`;
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

        // Increment usage count ONLY on success
        if (isSuccess) {
            // Increment token usage in database
            await incrementTokenUsage(tokenInfo.token);

            const newCount = currentUses + 1;
            // Update order getcid usage
            await supabase
                .from('amazon_orders')
                .update({
                    getcid_count: newCount,
                    getcid_used: newCount >= maxUses,
                    getcid_used_at: new Date().toISOString()
                })
                .eq('order_id', cleanIdentifier);

            const remainingUses = maxUses - newCount;
            return NextResponse.json({
                success: true,
                confirmationId: trimmedResponse,
                message: 'Confirmation ID generated successfully!',
                remainingUses,
                maxUses
            });
        }

        // Handle token-specific errors
        if (apiStatus === 'token_error') {
            // Mark token as potentially exhausted and try to sync with API
            const apiUsage = await verifyTokenWithApi(tokenInfo.token);
            if (apiUsage) {
                await supabase
                    .from('getcid_tokens')
                    .update({
                        count_used: apiUsage.count_used,
                        total_available: apiUsage.total,
                        last_verified_at: new Date().toISOString(),
                        is_active: apiUsage.count_used < apiUsage.total
                    })
                    .eq('token', tokenInfo.token);
            }
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

