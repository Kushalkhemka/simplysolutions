import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Validate order, check warranty, check username availability
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');
        const checkUsername = searchParams.get('checkUsername');

        // Username availability check
        if (checkUsername) {
            const prefix = checkUsername.trim().toLowerCase();

            if (!prefix || prefix.length < 3) {
                return NextResponse.json({
                    available: false,
                    error: 'Username must be at least 3 characters'
                });
            }

            // Check if username_prefix already exists
            const { data: existing } = await supabase
                .from('office365_customizations')
                .select('id')
                .eq('username_prefix', prefix)
                .maybeSingle();

            return NextResponse.json({
                available: !existing,
                username: `${prefix}@ms365.pro`
            });
        }

        // Order validation
        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        // Check if order exists and is OFFICE365 FSN
        let order: { order_id: string; fsn: string; license_key_id: string | null; contact_email: string | null } | null = null;

        const { data: exactMatch, error: exactError } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn, license_key_id, contact_email')
            .eq('order_id', orderId.trim())
            .maybeSingle();

        if (exactError) console.error('Exact match error:', exactError);
        order = exactMatch;

        // Fallback: try case-insensitive search
        if (!order) {
            const { data: fallbackMatch, error: fallbackError } = await supabase
                .from('amazon_orders')
                .select('order_id, fsn, license_key_id, contact_email')
                .ilike('order_id', orderId.trim())
                .maybeSingle();
            if (fallbackError) console.error('Fallback match error:', fallbackError);
            order = fallbackMatch;
        }

        if (!order) {
            return NextResponse.json({
                valid: false,
                error: 'Order ID not found. Please check your Amazon Order ID.'
            });
        }

        if (!order.fsn || !order.fsn.toUpperCase().startsWith('OFFICE365')) {
            return NextResponse.json({
                valid: false,
                error: 'This order is not for an Office 365 product. Request Customization is only available for Office 365 orders.'
            });
        }

        // Check if customization already submitted
        const { data: existingCustomization } = await supabase
            .from('office365_customizations')
            .select('id, is_completed, username_prefix, generated_email')
            .eq('order_id', orderId.trim())
            .maybeSingle();

        if (existingCustomization) {
            if (existingCustomization.is_completed) {
                return NextResponse.json({
                    valid: true,
                    alreadyCustomized: true,
                    generatedEmail: existingCustomization.generated_email,
                    message: 'Your customization request has already been fulfilled!'
                });
            }
            return NextResponse.json({
                valid: true,
                alreadySubmitted: true,
                usernamePrefix: existingCustomization.username_prefix,
                message: 'A customization request has already been submitted for this order. Please wait for processing.'
            });
        }

        // Check warranty status - must be submitted (any status)
        const { data: warranty } = await supabase
            .from('warranty_registrations')
            .select('id, status')
            .eq('order_id', orderId.trim())
            .maybeSingle();

        if (!warranty) {
            return NextResponse.json({
                valid: true,
                warrantyRequired: true,
                warrantyStatus: null,
                error: 'Please complete your Digital Warranty registration first before requesting customization.',
                buyerEmail: order.contact_email
            });
        }

        // All checks passed
        return NextResponse.json({
            valid: true,
            warrantyVerified: true,
            buyerEmail: order.contact_email,
            message: 'Order verified. You can proceed with customization.'
        });

    } catch (error) {
        console.error('Request customization GET error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST: Submit a customization request
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, usernamePrefix, firstName, lastName, customerEmail } = body;

        // Validate required fields
        if (!orderId || !usernamePrefix || !firstName || !lastName || !customerEmail) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        const trimmedPrefix = usernamePrefix.trim().toLowerCase();
        const trimmedOrderId = orderId.trim();

        // Validate username format
        if (trimmedPrefix.length < 3) {
            return NextResponse.json(
                { error: 'Username must be at least 3 characters' },
                { status: 400 }
            );
        }

        if (!/^[a-z][a-z0-9._-]*$/.test(trimmedPrefix)) {
            return NextResponse.json(
                { error: 'Username must start with a letter and can only contain letters, numbers, dots, hyphens, and underscores' },
                { status: 400 }
            );
        }

        // Verify order exists and is OFFICE365
        let order: { order_id: string; fsn: string } | null = null;

        const { data: exactOrder } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn')
            .eq('order_id', trimmedOrderId)
            .maybeSingle();
        order = exactOrder;

        if (!order) {
            const { data: fallbackOrder } = await supabase
                .from('amazon_orders')
                .select('order_id, fsn')
                .ilike('order_id', trimmedOrderId)
                .maybeSingle();
            order = fallbackOrder;
        }

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            );
        }

        if (!order.fsn || !order.fsn.toUpperCase().startsWith('OFFICE365')) {
            return NextResponse.json(
                { error: 'This order is not eligible for customization' },
                { status: 400 }
            );
        }

        // Verify warranty exists (any status - just needs to be submitted)
        const { data: warranty } = await supabase
            .from('warranty_registrations')
            .select('id, status')
            .eq('order_id', trimmedOrderId)
            .maybeSingle();

        if (!warranty) {
            return NextResponse.json(
                { error: 'You must complete Digital Warranty registration before requesting customization.' },
                { status: 400 }
            );
        }

        // Check if already submitted
        const { data: existingCustomization } = await supabase
            .from('office365_customizations')
            .select('id')
            .eq('order_id', trimmedOrderId)
            .maybeSingle();

        if (existingCustomization) {
            return NextResponse.json(
                { error: 'A customization request has already been submitted for this order.' },
                { status: 409 }
            );
        }

        // Check username uniqueness
        const { data: existingUsername } = await supabase
            .from('office365_customizations')
            .select('id')
            .eq('username_prefix', trimmedPrefix)
            .maybeSingle();

        if (existingUsername) {
            return NextResponse.json(
                { error: 'This username is already taken. Please choose a different one.' },
                { status: 409 }
            );
        }

        // Insert the customization request
        const displayName = `${firstName.trim()} ${lastName.trim()}`;
        const { data: inserted, error: insertError } = await supabase
            .from('office365_customizations')
            .insert({
                order_id: trimmedOrderId,
                display_name: displayName,
                first_name: firstName.trim(),
                last_name: lastName.trim(),
                username_prefix: trimmedPrefix,
                customer_email: customerEmail.trim(),
                is_completed: false,
            })
            .select()
            .single();

        if (insertError) {
            console.error('Insert customization error:', insertError);

            // Handle unique constraint violation
            if (insertError.code === '23505') {
                if (insertError.message.includes('username_prefix')) {
                    return NextResponse.json(
                        { error: 'This username is already taken. Please choose a different one.' },
                        { status: 409 }
                    );
                }
                return NextResponse.json(
                    { error: 'A customization request already exists for this order.' },
                    { status: 409 }
                );
            }

            return NextResponse.json(
                { error: 'Failed to submit customization request' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Your customization request has been submitted successfully! We will process it within 24-48 hours.',
            requestId: inserted.id,
            requestedUsername: `${trimmedPrefix}@ms365.pro`
        });

    } catch (error) {
        console.error('Request customization POST error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
