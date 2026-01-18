import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import crypto from 'crypto';

// POST /api/webhooks/razorpay - Handle Razorpay payment webhooks
export async function POST(request: NextRequest) {
    try {
        const body = await request.text();
        const signature = request.headers.get('x-razorpay-signature');

        if (!signature) {
            return new Response('Missing signature', { status: 400 });
        }

        // Verify webhook signature
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || '')
            .update(body)
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid webhook signature');
            return new Response('Invalid signature', { status: 400 });
        }

        const event = JSON.parse(body);
        const adminClient = getAdminClient();

        switch (event.event) {
            case 'payment.captured': {
                const payment = event.payload.payment.entity;
                const orderId = payment.notes?.order_id;

                if (!orderId) {
                    console.error('No order_id in payment notes');
                    return new Response('OK', { status: 200 });
                }

                // Get order
                const { data: order } = await adminClient
                    .from('orders')
                    .select('id, status, user_id')
                    .eq('id', orderId)
                    .single();

                if (!order) {
                    console.error('Order not found:', orderId);
                    return new Response('OK', { status: 200 });
                }

                // Skip if already processed
                if (order.status === 'paid' || order.status === 'delivered') {
                    return new Response('OK', { status: 200 });
                }

                // Update order
                await adminClient
                    .from('orders')
                    .update({
                        status: 'paid',
                        payment_status: 'completed',
                        razorpay_payment_id: payment.id,
                        paid_at: new Date().toISOString(),
                    })
                    .eq('id', orderId);

                // Get order items
                const { data: orderItems } = await adminClient
                    .from('order_items')
                    .select('id, product_id, quantity')
                    .eq('order_id', orderId);

                // Allocate license keys
                if (orderItems) {
                    for (const item of orderItems) {
                        const { data: licenseKeys } = await adminClient
                            .from('license_keys')
                            .select('id, license_key')
                            .eq('product_id', item.product_id)
                            .eq('status', 'available')
                            .limit(item.quantity);

                        if (licenseKeys && licenseKeys.length > 0) {
                            const keyIds = licenseKeys.map(k => k.id);
                            const keys = licenseKeys.map(k => k.license_key);

                            await adminClient
                                .from('order_items')
                                .update({
                                    license_keys: keys,
                                    license_key_ids: keyIds,
                                    status: 'delivered',
                                })
                                .eq('id', item.id);

                            await adminClient
                                .from('license_keys')
                                .update({
                                    status: 'sold',
                                    order_id: orderId,
                                    order_item_id: item.id,
                                    sold_at: new Date().toISOString(),
                                })
                                .in('id', keyIds);
                        }
                    }
                }

                // Update order status to delivered
                await adminClient
                    .from('orders')
                    .update({
                        status: 'delivered',
                        delivery_status: 'delivered',
                        delivered_at: new Date().toISOString(),
                    })
                    .eq('id', orderId);

                // Clear user's cart
                await adminClient
                    .from('cart_items')
                    .delete()
                    .eq('user_id', order.user_id);

                // Update product sold counts
                if (orderItems) {
                    for (const item of orderItems) {
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

                console.log('Payment captured and processed:', orderId);
                break;
            }

            case 'payment.failed': {
                const payment = event.payload.payment.entity;
                const orderId = payment.notes?.order_id;

                if (orderId) {
                    await adminClient
                        .from('orders')
                        .update({
                            status: 'failed',
                            payment_status: 'failed',
                        })
                        .eq('id', orderId);
                }
                break;
            }

            case 'refund.created': {
                const refund = event.payload.refund.entity;
                const paymentId = refund.payment_id;

                const { data: order } = await adminClient
                    .from('orders')
                    .select('id')
                    .eq('razorpay_payment_id', paymentId)
                    .single();

                if (order) {
                    await adminClient
                        .from('orders')
                        .update({
                            status: 'refunded',
                            payment_status: 'refunded',
                        })
                        .eq('id', order.id);
                }
                break;
            }
        }

        return new Response('OK', { status: 200 });
    } catch (error) {
        console.error('Webhook error:', error);
        return new Response('Webhook error', { status: 500 });
    }
}
