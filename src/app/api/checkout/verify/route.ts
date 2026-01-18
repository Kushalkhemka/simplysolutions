import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { paymentVerificationSchema } from '@/lib/utils/validation';
import { verifyPaymentSignature } from '@/lib/razorpay';

// POST /api/checkout/verify - Verify payment and allocate license keys
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login');
        }

        const body = await request.json();
        const parsed = paymentVerificationSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid payment data', 400);
        }

        const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = parsed.data;

        // Verify signature
        const isValid = await verifyPaymentSignature(
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        );

        if (!isValid) {
            return errorResponse('Payment verification failed', 400);
        }

        const adminClient = getAdminClient();

        // Get order
        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .select('id, user_id, status')
            .eq('razorpay_order_id', razorpay_order_id)
            .single();

        if (orderError || !order) {
            return errorResponse('Order not found', 404);
        }

        if (order.user_id !== user.id) {
            return errorResponse('Unauthorized', 403);
        }

        if (order.status === 'paid' || order.status === 'delivered') {
            return successResponse({
                message: 'Payment already verified',
                orderId: order.id,
            });
        }

        // Update order payment status
        await adminClient
            .from('orders')
            .update({
                status: 'paid',
                payment_status: 'completed',
                razorpay_payment_id,
                razorpay_signature,
                paid_at: new Date().toISOString(),
            })
            .eq('id', order.id);

        // Get order items
        const { data: orderItems } = await adminClient
            .from('order_items')
            .select('id, product_id, quantity')
            .eq('order_id', order.id);

        // Allocate license keys
        if (orderItems) {
            for (const item of orderItems) {
                // Get available license keys for this product
                const { data: licenseKeys } = await adminClient
                    .from('license_keys')
                    .select('id, license_key')
                    .eq('product_id', item.product_id)
                    .eq('status', 'available')
                    .limit(item.quantity);

                if (licenseKeys && licenseKeys.length > 0) {
                    const keyIds = licenseKeys.map(k => k.id);
                    const keys = licenseKeys.map(k => k.license_key);

                    // Update order item with license keys
                    await adminClient
                        .from('order_items')
                        .update({
                            license_keys: keys,
                            license_key_ids: keyIds,
                            status: 'delivered',
                        })
                        .eq('id', item.id);

                    // Mark license keys as sold
                    await adminClient
                        .from('license_keys')
                        .update({
                            status: 'sold',
                            order_id: order.id,
                            order_item_id: item.id,
                            sold_at: new Date().toISOString(),
                        })
                        .in('id', keyIds);
                }
            }
        }

        // Handle loyalty points transactions
        // Get the order details to retrieve loyalty points used and total amount
        const { data: orderDetails } = await adminClient
            .from('orders')
            .select('total_amount, loyalty_points_used')
            .eq('id', order.id)
            .single();

        if (orderDetails) {
            // Step 1: Deduct redeemed points if any were used
            if (orderDetails.loyalty_points_used && orderDetails.loyalty_points_used > 0) {
                await adminClient
                    .from('loyalty_transactions')
                    .insert({
                        user_id: order.user_id,
                        order_id: order.id,
                        transaction_type: 'redeemed',
                        points: orderDetails.loyalty_points_used,
                        description: `Redeemed ${orderDetails.loyalty_points_used} points for order`,
                        metadata: { order_number: order.id },
                    });
            }

            // Step 2: Award new points based on total amount paid (100% points)
            const pointsToEarn = Math.floor(orderDetails.total_amount);

            if (pointsToEarn > 0) {
                await adminClient
                    .from('loyalty_transactions')
                    .insert({
                        user_id: order.user_id,
                        order_id: order.id,
                        transaction_type: 'earned',
                        points: pointsToEarn,
                        description: `Earned ${pointsToEarn} points from purchase`,
                        metadata: { order_number: order.id },
                    });

                // Update order with points earned
                await adminClient
                    .from('orders')
                    .update({ loyalty_points_earned: pointsToEarn })
                    .eq('id', order.id);
            }
        }

        // Update order delivery status
        await adminClient
            .from('orders')
            .update({
                status: 'delivered',
                delivery_status: 'delivered',
                delivered_at: new Date().toISOString(),
            })
            .eq('id', order.id);

        // Clear user's cart
        await adminClient
            .from('cart_items')
            .delete()
            .eq('user_id', user.id);

        // Update product sold counts
        if (orderItems) {
            for (const item of orderItems) {
                // Get current sold_count and increment it
                const { data: product } = await adminClient
                    .from('products')
                    .select('sold_count')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await adminClient
                        .from('products')
                        .update({ sold_count: (product.sold_count || 0) + item.quantity })
                        .eq('id', item.product_id);
                }
            }
        }

        return successResponse({
            message: 'Payment verified and license keys allocated',
            orderId: order.id,
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return errorResponse('Internal server error', 500);
    }
}
