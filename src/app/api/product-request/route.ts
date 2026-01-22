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
    '365e5': '365E5-REQ'
};

export async function POST(request: NextRequest) {
    try {
        const { email, orderId, requestType, mobileNumber } = await request.json();

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
        // Note: We search by order_id for both secret codes and Amazon Order IDs
        // since the manual order creation stores both in order_id field
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

        // Use the actual FSN from the order if available, otherwise fallback to request type
        const fsn = order.fsn || REQUEST_TYPE_TO_FSN[requestType] || `${requestType.toUpperCase()}-REQ`;

        // Create new request
        // Note: request_type is a GENERATED column based on fsn, so we don't insert it directly
        const { data, error } = await supabase
            .from('product_requests')
            .insert({
                email: email.trim(),
                order_id: cleanOrderId,
                fsn: fsn,
                mobile_number: mobileNumber || null,
                is_completed: false
            })
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

        return NextResponse.json({
            success: true,
            message: 'Your request has been submitted successfully! We will process it within 24 hours.',
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
