import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Parse a license key in format "Username: <value> | Password: <value>"
 * Returns { username, password } or null if invalid format
 */
function parseLicenseKey(licenseKey: string): { username: string; password: string } | null {
    const match = licenseKey.match(/Username:\s*(.+?)\s*\|\s*Password:\s*(.+)/i);
    if (!match) return null;
    return { username: match[1].trim(), password: match[2].trim() };
}

// GET: Lookup order and auto-fetch the username from license key
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const cleanOrderId = orderId.trim();

        // Find the order in amazon_orders
        let order: { id: string; order_id: string; fsn: string; license_key_id: string | null } | null = null;

        const { data: exactMatch } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id')
            .eq('order_id', cleanOrderId)
            .maybeSingle();
        order = exactMatch;

        if (!order) {
            const { data: fallbackMatch } = await supabase
                .from('amazon_orders')
                .select('id, order_id, fsn, license_key_id')
                .ilike('order_id', cleanOrderId)
                .maybeSingle();
            order = fallbackMatch;
        }

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found. Please verify your Order ID.' },
                { status: 404 }
            );
        }

        // Verify it's an OFFICE365 FSN
        const fsn = order.fsn?.toUpperCase() || '';
        if (!fsn.startsWith('OFFICE365')) {
            return NextResponse.json(
                { error: 'Password reset is only available for Office 365 products.' },
                { status: 400 }
            );
        }

        // Verify the order has a license key assigned
        if (!order.license_key_id) {
            return NextResponse.json(
                { error: 'This order has not been activated yet. Please activate first.' },
                { status: 400 }
            );
        }

        // Fetch the license key
        const { data: licenseKeyData, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key')
            .eq('id', order.license_key_id)
            .single();

        if (keyError || !licenseKeyData) {
            return NextResponse.json(
                { error: 'License key not found for this order.' },
                { status: 404 }
            );
        }

        // Parse the license key to extract username
        const parsed = parseLicenseKey(licenseKeyData.license_key);
        if (!parsed) {
            return NextResponse.json(
                { error: 'Unable to parse license key format. Please contact support.' },
                { status: 500 }
            );
        }

        // Check if there's already a pending request
        const { data: existingRequest } = await supabase
            .from('password_reset_requests')
            .select('id, status')
            .eq('order_id', cleanOrderId)
            .eq('status', 'PENDING')
            .single();

        return NextResponse.json({
            success: true,
            username: parsed.username,
            licenseKeyId: licenseKeyData.id,
            hasPendingRequest: !!existingRequest,
        });

    } catch (error) {
        console.error('Password reset lookup error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Submit a new password reset request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, communicationEmail } = body;

        // Validate required fields
        if (!orderId || !communicationEmail) {
            return NextResponse.json(
                { error: 'Order ID and communication email are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(communicationEmail)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        const cleanOrderId = orderId.trim();

        // Find the order in amazon_orders
        let order: { id: string; order_id: string; fsn: string; license_key_id: string | null } | null = null;

        const { data: exactMatch } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn, license_key_id')
            .eq('order_id', cleanOrderId)
            .maybeSingle();
        order = exactMatch;

        if (!order) {
            const { data: fallbackMatch } = await supabase
                .from('amazon_orders')
                .select('id, order_id, fsn, license_key_id')
                .ilike('order_id', cleanOrderId)
                .maybeSingle();
            order = fallbackMatch;
        }

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found. Please verify your Order ID.' },
                { status: 404 }
            );
        }

        // Verify it's an OFFICE365 FSN
        const fsn = order.fsn?.toUpperCase() || '';
        if (!fsn.startsWith('OFFICE365')) {
            return NextResponse.json(
                { error: 'Password reset is only available for Office 365 products.' },
                { status: 400 }
            );
        }

        // Verify the order has a license key assigned
        if (!order.license_key_id) {
            return NextResponse.json(
                { error: 'This order has not been activated yet. Please activate first.' },
                { status: 400 }
            );
        }

        // Fetch the license key
        const { data: licenseKeyData, error: keyError } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key')
            .eq('id', order.license_key_id)
            .single();

        if (keyError || !licenseKeyData) {
            return NextResponse.json(
                { error: 'License key not found for this order.' },
                { status: 404 }
            );
        }

        // Parse the license key to extract username
        const parsed = parseLicenseKey(licenseKeyData.license_key);
        if (!parsed) {
            return NextResponse.json(
                { error: 'Unable to parse license key format. Please contact support.' },
                { status: 500 }
            );
        }

        // Check if there's already a pending request
        const { data: existingRequest } = await supabase
            .from('password_reset_requests')
            .select('id, status')
            .eq('order_id', cleanOrderId)
            .eq('status', 'PENDING')
            .maybeSingle();

        if (existingRequest) {
            return NextResponse.json(
                { error: 'You already have a pending password reset request for this order. Please wait for it to be processed.' },
                { status: 400 }
            );
        }

        // Create the password reset request
        try {
            const { data: resetRequest, error: insertError } = await supabase
                .from('password_reset_requests')
                .insert({
                    order_id: cleanOrderId,
                    username: parsed.username,
                    communication_email: communicationEmail,
                    original_license_key_id: licenseKeyData.id,
                    status: 'PENDING'
                })
                .select()
                .single();

            if (insertError) {
                console.error('Password reset insert error:', insertError);
                return NextResponse.json(
                    { error: `Failed: ${insertError.message || insertError.code || JSON.stringify(insertError)}` },
                    { status: 500 }
                );
            }

            return NextResponse.json({
                success: true,
                message: 'Password reset request submitted successfully! Your new password will be sent to your email within 12-24 hours.',
                requestId: resetRequest.id
            });
        } catch (insertCatchError: unknown) {
            const errMsg = insertCatchError instanceof Error ? insertCatchError.message : String(insertCatchError);
            console.error('Password reset insert caught error:', errMsg);
            return NextResponse.json(
                { error: `Insert failed: ${errMsg}` },
                { status: 500 }
            );
        }

    } catch (error) {
        console.error('Password reset request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
