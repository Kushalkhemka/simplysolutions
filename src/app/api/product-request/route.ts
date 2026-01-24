import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Map request type to FSN prefix
const REQUEST_TYPE_TO_FSN: Record<string, string> = {
    'autocad': 'AUTOCAD-REQ',
    'canva': 'CANVA-REQ',
    'revit': 'REVIT-REQ',
    'fusion360': 'FUSION360-REQ',
    '365e5': '365E5'
};

export async function POST(request: NextRequest) {
    try {
        const { email, orderId, requestType, mobileNumber, firstName, lastName, usernamePrefix } = await request.json();

        // Validate required fields
        if (!email || !orderId || !requestType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Validate request type
        const validTypes = ['autocad', 'canva', 'revit', 'fusion360', '365e5'];
        if (!validTypes.includes(requestType)) {
            return NextResponse.json(
                { error: 'Invalid request type' },
                { status: 400 }
            );
        }

        // Additional validation for 365e5 requests
        if (requestType === '365e5') {
            if (!firstName || !lastName || !usernamePrefix || !mobileNumber) {
                return NextResponse.json(
                    { error: 'First name, last name, username prefix, and WhatsApp number are required for Microsoft 365 requests' },
                    { status: 400 }
                );
            }

            // Validate username prefix format
            const cleanPrefix = usernamePrefix.toLowerCase().trim();
            if (cleanPrefix.length < 3 || !/^[a-z0-9.]+$/.test(cleanPrefix)) {
                return NextResponse.json(
                    { error: 'Username must be at least 3 characters and contain only letters, numbers, and dots' },
                    { status: 400 }
                );
            }
        }

        // Clean the order ID
        const cleanOrderId = orderId.trim();

        // Check if it's a valid format: either 15-17 digit secret code OR Amazon Order ID (XXX-XXXXXXX-XXXXXXX)
        const isSecretCode = /^\d{15,17}$/.test(cleanOrderId);
        const isAmazonOrderId = /^\d{3}-\d{7}-\d{7}$/.test(cleanOrderId);

        if (!isSecretCode && !isAmazonOrderId) {
            return NextResponse.json(
                { error: 'Invalid format. Please enter a 15-digit secret code OR Amazon Order ID (e.g., 408-1234567-1234567).' },
                { status: 400 }
            );
        }

        // Verify the order exists in amazon_orders table
        const { data: order, error: queryError } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn')
            .eq('order_id', cleanOrderId)
            .single();

        console.log('Order lookup:', { cleanOrderId, order, queryError });

        if (!order) {
            return NextResponse.json(
                {
                    error: isAmazonOrderId
                        ? 'Amazon Order ID not found. Please check your order ID and try again.'
                        : 'Secret code not found. Please check your code and try again.'
                },
                { status: 404 }
            );
        }

        // Check if request already exists for this order
        const { data: existing } = await supabase
            .from('product_requests')
            .select('id, is_completed')
            .eq('order_id', cleanOrderId)
            .single();

        if (existing) {
            return NextResponse.json({
                success: true,
                message: existing.is_completed
                    ? 'Your request has already been processed. Check your email.'
                    : 'Your request is already being processed.',
                status: existing.is_completed ? 'completed' : 'processing'
            });
        }

        // For 365e5 requests, validate the order FSN is 365E5
        if (requestType === '365e5') {
            if (!order.fsn || !order.fsn.toUpperCase().startsWith('365E5')) {
                return NextResponse.json(
                    { error: 'This order is not for Microsoft 365 Enterprise. Please use the correct activation page for your product.' },
                    { status: 400 }
                );
            }

            // Also check office365_requests table
            const { data: existing365 } = await supabase
                .from('office365_requests')
                .select('id, is_completed')
                .eq('order_id', cleanOrderId)
                .single();

            if (existing365) {
                return NextResponse.json({
                    success: true,
                    message: existing365.is_completed
                        ? 'Your Microsoft 365 account has been created. Check your email for credentials.'
                        : 'Your Microsoft 365 request is being processed.',
                    status: existing365.is_completed ? 'completed' : 'processing'
                });
            }
        }

        // For canva requests, validate the order FSN starts with CANVA
        if (requestType === 'canva') {
            if (!order.fsn || !order.fsn.toUpperCase().startsWith('CANVA')) {
                return NextResponse.json(
                    { error: 'This order is not for Canva Pro. Please use the correct activation page for your product.' },
                    { status: 400 }
                );
            }
        }

        // For autocad requests, validate the order FSN starts with AUTOCAD
        if (requestType === 'autocad') {
            if (!order.fsn || !order.fsn.toUpperCase().startsWith('AUTOCAD')) {
                return NextResponse.json(
                    { error: 'This order is not for AutoCAD. Please use the correct activation page for your product.' },
                    { status: 400 }
                );
            }
        }

        // Use the actual FSN from the order if available, otherwise fallback to request type
        const fsn = order.fsn || REQUEST_TYPE_TO_FSN[requestType] || `${requestType.toUpperCase()}-REQ`;

        // Create new request in product_requests
        const insertData: any = {
            email: email.trim(),
            order_id: cleanOrderId,
            fsn: fsn,
            mobile_number: mobileNumber || null,
            is_completed: false,
            request_type: requestType
        };

        // Note: first_name, last_name, username_prefix are only stored in office365_requests table

        const { data, error } = await supabase
            .from('product_requests')
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Product request insert error:', error);
            return NextResponse.json(
                { error: `Failed to submit request: ${error.message}` },
                { status: 500 }
            );
        }

        console.log('Product request created:', data);

        // For 365e5 requests, also create entry in office365_requests table
        if (requestType === '365e5') {
            const { error: office365Error } = await supabase
                .from('office365_requests')
                .insert({
                    order_id: cleanOrderId,
                    first_name: firstName.trim(),
                    last_name: lastName.trim(),
                    username_prefix: usernamePrefix.toLowerCase().trim(),
                    whatsapp_number: mobileNumber.trim(),
                    email: email.trim(),
                    is_completed: false
                });

            if (office365Error) {
                console.error('Office365 request insert error:', office365Error);
                // Don't fail the request, just log the error
            } else {
                console.log('Office365 request created for order:', cleanOrderId);
            }
        }

        return NextResponse.json({
            success: true,
            message: requestType === '365e5'
                ? 'Your Microsoft 365 account request has been submitted! We will create your account and notify you within 24 hours.'
                : 'Your request has been submitted successfully! We will process it within 24 hours.',
            requestId: data.id
        });

    } catch (error) {
        console.error('Product request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

