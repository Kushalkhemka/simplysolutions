import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { installationId } = body;

        if (!installationId) {
            return NextResponse.json({ error: 'Missing Installation ID' }, { status: 400 });
        }

        // Validate Installation ID format (63 digits)
        const cleanIid = installationId.replace(/\s/g, '');
        if (!/^\d{63}$/.test(cleanIid)) {
            return NextResponse.json({ error: 'Invalid Installation ID. Must be 63 digits.' }, { status: 400 });
        }

        // Get an available token from the database
        const tokenInfo = await getAvailableToken();
        if (!tokenInfo) {
            console.error('No GetCID tokens available in database');
            return NextResponse.json({
                error: 'Service temporarily unavailable. Please try again later.'
            }, { status: 503 });
        }

        console.log(`[Internal GetCID] Using token: ${tokenInfo.token.substring(0, 4)}... (${tokenInfo.remaining} remaining)`);

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

        // Log the usage (for internal tracking, no order linkage)
        await supabase.from('getcid_usage').insert({
            identifier: 'INTERNAL',
            identifier_type: 'internal',
            installation_id: cleanIid,
            confirmation_id: isSuccess ? trimmedResponse : null,
            api_response: trimmedResponse,
            api_status: apiStatus,
            ip_address: ip !== 'unknown' ? ip : null,
            user_agent: request.headers.get('user-agent')
        });

        if (isSuccess) {
            // Increment token usage in database
            await incrementTokenUsage(tokenInfo.token);

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
            blocked_key: 'This product key may be blocked.',
            ip_blocked: 'Too many requests. Please try again later.',
            iid_blocked: 'This Installation ID has too many requests. Please try again later.',
            token_error: 'Service configuration error. Please contact support.',
            server_busy: 'Server is busy. Please try again in a few minutes.',
            error: 'An error occurred. Please try again.'
        };

        return NextResponse.json({
            success: false,
            error: errorMessages[apiStatus] || errorMessages.error,
            rawResponse: trimmedResponse
        });

    } catch (error) {
        console.error('Internal GetCID API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
