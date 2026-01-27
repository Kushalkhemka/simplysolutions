import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendSubscriptionEmail, send365EnterpriseEmail } from '@/lib/email';
import { getSubscriptionConfig } from '@/lib/amazon/subscription-products';
import { notifyProductRequestStatus, notify365E5Fulfilled } from '@/lib/push/customer-notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { requestId, subscriptionEmail, generatedEmail, generatedPassword } = await request.json();

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

        // Check if this is a 365E5 request
        const is365E5 = fsn?.startsWith('365E5') || productRequest.request_type === '365e5';

        // For 365E5, require generated credentials
        if (is365E5) {
            if (!generatedEmail || !generatedPassword) {
                return NextResponse.json(
                    { error: 'Generated email and password are required for Microsoft 365 requests' },
                    { status: 400 }
                );
            }

            // Fetch the office365_requests entry
            const { data: office365Request } = await supabase
                .from('office365_requests')
                .select('*')
                .eq('order_id', productRequest.order_id)
                .single();

            // Update office365_requests with generated credentials
            const { error: update365Error } = await supabase
                .from('office365_requests')
                .update({
                    generated_email: generatedEmail.trim(),
                    generated_password: generatedPassword.trim(),
                    is_completed: true,
                    completed_at: new Date().toISOString()
                })
                .eq('order_id', productRequest.order_id);

            if (update365Error) {
                console.error('Error updating office365_requests:', update365Error);
                // Continue anyway, don't fail the request
            }

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

            // Update amazon_orders
            if (productRequest.order_id) {
                const licenseKeyValue = `Microsoft 365 - ${generatedEmail}`;
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
                }
            }

            // Send 365 enterprise email
            const emailResult = await send365EnterpriseEmail({
                to: productRequest.email,
                orderId: productRequest.order_id || requestId,
                firstName: office365Request?.first_name || 'Customer',
                generatedEmail: generatedEmail.trim(),
                generatedPassword: generatedPassword.trim()
            });

            if (!emailResult.success) {
                console.error('Failed to send 365 email:', emailResult.error);
                return NextResponse.json({
                    success: true,
                    emailSent: false,
                    emailError: 'Failed to send email notification',
                    message: 'Request marked as completed but email notification failed'
                });
            }

            // Send push notification to customer with credentials
            try {
                await notify365E5Fulfilled(
                    productRequest.order_id || requestId,
                    productRequest.email,
                    generatedEmail.trim(),
                    generatedPassword.trim()
                );
            } catch (pushError) {
                console.error('Failed to send push notification:', pushError);
                // Don't fail the request if push fails
            }

            return NextResponse.json({
                success: true,
                emailSent: true,
                emailId: emailResult.id,
                message: 'Microsoft 365 account created and notification sent',
                generatedEmail: generatedEmail
            });
        }

        // Check if this is a subscription product (non-365E5)
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

        // Send push notification to customer
        try {
            await notifyProductRequestStatus(
                productRequest.order_id || requestId,
                'fulfilled',
                subscriptionConfig?.productName || 'your subscription',
                productRequest.email
            );
        } catch (pushError) {
            console.error('Failed to send push notification:', pushError);
            // Don't fail the request if push fails
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

