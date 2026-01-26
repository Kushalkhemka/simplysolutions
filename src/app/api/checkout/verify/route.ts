import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { paymentVerificationSchema } from '@/lib/utils/validation';
import { verifyPaymentSignature } from '@/lib/razorpay';
import { getInstallDocUrl } from '@/lib/amazon/asin-mapping';
import { sendDigitalDeliveryEmail, DigitalProductDelivery } from '@/lib/email';

// Generate unique 15-digit secret code
async function generateUniqueSecretCode(adminClient: ReturnType<typeof getAdminClient>): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const code = Array.from({ length: 15 }, () =>
            Math.floor(Math.random() * 10)
        ).join('');

        const { data: existing } = await adminClient
            .from('amazon_orders')
            .select('id')
            .eq('order_id', code)
            .single();

        if (!existing) {
            return code;
        }
    }

    throw new Error('Failed to generate unique secret code');
}

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

        // Get order with billing details
        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .select('id, user_id, status, order_number, billing_name, billing_email, billing_phone')
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

        // Get order items with product details INCLUDING FSN from products table
        const { data: orderItems } = await adminClient
            .from('order_items')
            .select('id, product_id, quantity, product_name, product_sku')
            .eq('order_id', order.id);

        // Allocate license keys AND create amazon_orders entries
        const digitalProducts: DigitalProductDelivery[] = [];

        if (orderItems) {
            for (const item of orderItems) {
                // Get FSN from products table
                const { data: product } = await adminClient
                    .from('products')
                    .select('fsn')
                    .eq('id', item.product_id)
                    .single();

                const fsn = product?.fsn || item.product_sku || 'UNKNOWN';
                const installDocUrl = getInstallDocUrl(fsn);

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

                // Generate ONE secret code per EACH quantity unit (not one per item)
                const secretCodes: string[] = [];
                for (let i = 0; i < item.quantity; i++) {
                    const secretCode = await generateUniqueSecretCode(adminClient);
                    secretCodes.push(secretCode);

                    // Insert into amazon_orders table for each secret code
                    const { error: amazonOrderError } = await adminClient
                        .from('amazon_orders')
                        .insert({
                            order_id: secretCode,
                            fsn: fsn,
                            fulfillment_type: 'website_payment',
                            contact_email: order.billing_email,
                            contact_phone: order.billing_phone || null,
                            warranty_status: 'PENDING',
                            quantity: 1, // Each secret code is for 1 unit
                        });

                    if (amazonOrderError) {
                        console.error('Failed to create amazon_orders entry:', amazonOrderError);
                    }

                    // Add to digital products list for email (each code separately)
                    digitalProducts.push({
                        productName: item.product_name,
                        secretCode: secretCode,
                        installationGuideUrl: installDocUrl ? `${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}${installDocUrl}` : null,
                    });
                }

                // Store secret codes and FSN in order_item for display on order page
                await adminClient
                    .from('order_items')
                    .update({
                        secret_codes: secretCodes,
                        product_fsn: fsn,
                    })
                    .eq('id', item.id);
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

        // Update product sold counts AND decrement stock_quantity
        if (orderItems) {
            for (const item of orderItems) {
                // Get current sold_count and stock_quantity
                const { data: product } = await adminClient
                    .from('products')
                    .select('sold_count, stock_quantity')
                    .eq('id', item.product_id)
                    .single();

                if (product) {
                    await adminClient
                        .from('products')
                        .update({
                            sold_count: (product.sold_count || 0) + item.quantity,
                            stock_quantity: Math.max(0, (product.stock_quantity || 0) - item.quantity)
                        })
                        .eq('id', item.product_id);
                }
            }
        }

        // Send digital delivery email with secret codes
        if (digitalProducts.length > 0 && order.billing_email) {
            try {
                await sendDigitalDeliveryEmail({
                    to: order.billing_email,
                    customerName: order.billing_name || 'Customer',
                    orderNumber: order.order_number,
                    products: digitalProducts,
                });
                console.log('Digital delivery email sent successfully for order:', order.order_number);
            } catch (emailError) {
                console.error('Failed to send digital delivery email:', emailError);
                // Don't fail the order if email fails
            }
        }

        return successResponse({
            message: 'Payment verified and license keys allocated',
            orderId: order.id,
            secretCodes: digitalProducts.map(p => ({ product: p.productName, code: p.secretCode })),
        });
    } catch (error) {
        console.error('Payment verification error:', error);
        return errorResponse('Internal server error', 500);
    }
}
