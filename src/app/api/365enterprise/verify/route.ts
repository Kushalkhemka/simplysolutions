import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const cleanOrderId = orderId.trim();

        // First check if a 365E5 request exists for this order
        const { data: request365, error: requestError } = await supabase
            .from('office365_requests')
            .select('*')
            .eq('order_id', cleanOrderId)
            .single();

        if (requestError && requestError.code !== 'PGRST116') {
            // PGRST116 = no rows returned, which is expected if not found
            console.error('Error fetching 365 request:', requestError);
            return NextResponse.json(
                { error: 'Database error' },
                { status: 500 }
            );
        }

        if (request365) {
            // Request exists - check if completed
            if (request365.is_completed && request365.generated_email && request365.generated_password) {
                return NextResponse.json({
                    success: true,
                    isCompleted: true,
                    generatedEmail: request365.generated_email,
                    generatedPassword: request365.generated_password,
                    firstName: request365.first_name,
                    lastName: request365.last_name
                });
            } else {
                // Request exists but not completed
                return NextResponse.json({
                    success: true,
                    isCompleted: false,
                    isPending: true,
                    message: 'Your request is being processed'
                });
            }
        }

        // Check if the order exists in amazon_orders
        const { data: order } = await supabase
            .from('amazon_orders')
            .select('id, order_id, fsn')
            .eq('order_id', cleanOrderId)
            .single();

        if (!order) {
            return NextResponse.json({
                success: false,
                error: 'Order not found. Please check your Order ID or Secret Code.'
            });
        }

        // Validate FSN is 365E5
        if (!order.fsn || !order.fsn.toUpperCase().startsWith('365E5')) {
            return NextResponse.json({
                success: false,
                error: 'This order is not for Microsoft 365 Enterprise. Please use the correct activation page for your product.'
            });
        }

        // Order exists and is 365E5 but no request yet
        return NextResponse.json({
            success: true,
            exists: false,
            message: 'Please submit your details to request your Microsoft 365 account'
        });

    } catch (error) {
        console.error('365 Enterprise verify error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
