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

        // Check if request already exists for this order
        const { data: existing } = await supabase
            .from('product_requests')
            .select('id, is_completed')
            .eq('order_id', orderId)
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

        // Create new request
        const { data, error } = await supabase
            .from('product_requests')
            .insert({
                email,
                order_id: orderId,
                request_type: requestType,
                mobile_number: mobileNumber || null,
                is_completed: false
            })
            .select()
            .single();

        if (error) {
            console.error('Product request insert error:', error);
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
