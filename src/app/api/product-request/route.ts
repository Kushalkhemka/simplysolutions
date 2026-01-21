import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        let order = null;
        if (isSecretCode) {
            const { data } = await supabase
                .from('amazon_orders')
                .select('id, order_id, amazon_order_id, fsn')
                .eq('order_id', cleanOrderId)
                .single();
            order = data;
        } else {
            const { data } = await supabase
                .from('amazon_orders')
                .select('id, order_id, amazon_order_id, fsn')
                .eq('amazon_order_id', cleanOrderId)
                .single();
            order = data;
        }

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
            .eq('request_type', requestType)
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

        // Get client IP
        const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') || null;

        // Create new request with reference to the amazon order
        const { data, error } = await supabase
            .from('product_requests')
            .insert({
                email,
                order_id: cleanOrderId,
                amazon_order_ref: order.id,  // Reference to amazon_orders.id
                request_type: requestType,
                mobile_number: mobileNumber || null,
                is_completed: false,
                ip_address: ip,
                fsn: order.fsn
            })
            .select()
            .single();

        if (error) {
            console.error('Product request insert error:', error);
            // If error is due to missing columns, try without them
            if (error.code === '42703') {
                const { data: fallbackData, error: fallbackError } = await supabase
                    .from('product_requests')
                    .insert({
                        email,
                        order_id: cleanOrderId,
                        request_type: requestType,
                        mobile_number: mobileNumber || null,
                        is_completed: false
                    })
                    .select()
                    .single();

                if (fallbackError) {
                    return NextResponse.json(
                        { error: 'Failed to submit request' },
                        { status: 500 }
                    );
                }

                return NextResponse.json({
                    success: true,
                    message: 'Your request has been submitted successfully! We will process it within 24 hours.',
                    requestId: fallbackData.id
                });
            }
            return NextResponse.json(
                { error: 'Failed to submit request' },
                { status: 500 }
            );
        }

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
