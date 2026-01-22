import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail, getSubscriptionConfig } from '@/lib/email';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { requestId, subscriptionEmail } = await request.json();

        if (!requestId) {
            return NextResponse.json(
                { error: 'Request ID is required' },
                { status: 400 }
            );
        }

        // Fetch the product request
        const { data: productRequest, error: fetchError } = await supabase
            .from('product_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (fetchError || !productRequest) {
            console.error('Error fetching product request:', fetchError);
            return NextResponse.json(
                { error: 'Product request not found' },
                { status: 404 }
            );
        }

        if (productRequest.is_completed) {
            return NextResponse.json(
                { error: 'This request has already been completed' },
                { status: 400 }
            );
        }

        // Get the FSN - either from product_requests.fsn or from amazon_orders
        let fsn = productRequest.fsn;

        if (productRequest.order_id) {
            // Try to get actual FSN from amazon_orders
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('fsn')
                .eq('order_id', productRequest.order_id)
                .single();

            if (order?.fsn) {
                fsn = order.fsn;
            }
        }

        // Check if this is a subscription product
        const subscriptionConfig = getSubscriptionConfig(fsn || '');

        if (!subscriptionConfig) {
            return NextResponse.json(
                { error: `Unknown subscription product type: ${fsn}` },
                { status: 400 }
            );
        }

        // The email where subscription was processed
        const processedEmail = subscriptionEmail || productRequest.email;
        const licenseKeyValue = `Subscription processed on ${processedEmail}`;

        // Update the product request to completed
        const { error: updateRequestError } = await supabase
            .from('product_requests')
            .update({
                is_completed: true,
                completed_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (updateRequestError) {
            console.error('Error updating product request:', updateRequestError);
            return NextResponse.json(
                { error: 'Failed to update product request' },
                { status: 500 }
            );
        }

        // Update the amazon_orders license_key if order_id exists
        if (productRequest.order_id) {
            const { error: updateOrderError } = await supabase
                .from('amazon_orders')
                .update({
                    license_key: licenseKeyValue,
                    is_redeemed: true,
                    redeemed_at: new Date().toISOString()
                })
                .eq('order_id', productRequest.order_id);

            if (updateOrderError) {
                console.error('Error updating amazon order:', updateOrderError);
                // Don't fail the request, just log it
            }
        }

        // Send email notification to customer
        const emailResult = await sendSubscriptionEmail({
            to: productRequest.email,
            orderId: productRequest.order_id || requestId,
            fsn: fsn || '',
            subscriptionEmail: processedEmail
        });

        if (!emailResult.success) {
            console.error('Failed to send subscription email:', emailResult.error);
            // Don't fail the request if email fails, but include in response
            return NextResponse.json({
                success: true,
                emailSent: false,
                emailError: 'Failed to send email notification',
                message: 'Request marked as completed but email notification failed'
            });
        }

        return NextResponse.json({
            success: true,
            emailSent: true,
            emailId: emailResult.id,
            message: 'Request completed and notification sent',
            licenseKey: licenseKeyValue
        });

    } catch (error) {
        console.error('Complete product request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
