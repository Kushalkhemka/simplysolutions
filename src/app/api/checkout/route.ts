import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { checkoutSchema } from '@/lib/utils/validation';
import { createRazorpayOrder } from '@/lib/razorpay';

// POST /api/checkout - Create order and Razorpay payment
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to checkout');
        }

        const body = await request.json();
        const parsed = checkoutSchema.safeParse(body);

        if (!parsed.success) {
            console.error('Checkout validation error:', JSON.stringify(parsed.error.issues, null, 2));
            return errorResponse('Invalid checkout data: ' + parsed.error.issues.map((e: { message: string }) => e.message).join(', '), 400);
        }

        const { billing, couponCode, customerNotes, loyaltyPointsToUse } = parsed.data;

        // Get cart items
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
        id,
        quantity,
        product:products(id, sku, name, price, mrp, main_image_url, stock_quantity, is_active)
      `)
            .eq('user_id', user.id);

        if (cartError || !cartItems || cartItems.length === 0) {
            return errorResponse('Cart is empty', 400);
        }

        // Validate cart items
        const validItems = (cartItems as any[]).filter((item: any) =>
            item.product?.is_active &&
            item.product?.stock_quantity >= item.quantity
        );

        if (validItems.length !== cartItems.length) {
            return errorResponse('Some items are no longer available', 400);
        }

        // Calculate totals
        let subtotal = 0;
        let mrpTotal = 0;

        for (const item of validItems as any[]) {
            subtotal += (item.product?.price || 0) * item.quantity;
            mrpTotal += (item.product?.mrp || 0) * item.quantity;
        }

        // Handle coupon if provided
        let couponDiscount = 0;
        let couponId: string | null = null;

        if (couponCode) {
            const { data: coupon } = await supabase
                .from('coupons')
                .select('*')
                .eq('code', couponCode.toUpperCase())
                .eq('is_active', true)
                .single();

            if (coupon) {
                const now = new Date();
                const validFrom = new Date(coupon.valid_from);
                const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

                if (now >= validFrom && (!validUntil || now <= validUntil)) {
                    if (subtotal >= coupon.min_order_amount) {
                        if (coupon.discount_type === 'percentage') {
                            couponDiscount = (subtotal * coupon.discount_value) / 100;
                            if (coupon.max_discount_amount) {
                                couponDiscount = Math.min(couponDiscount, coupon.max_discount_amount);
                            }
                        } else {
                            couponDiscount = coupon.discount_value;
                        }
                        couponId = coupon.id;
                    }
                }
            }
        }

        // Handle loyalty points redemption
        let loyaltyDiscount = 0;
        let pointsToRedeem = 0;

        if (loyaltyPointsToUse && loyaltyPointsToUse > 0) {
            // Get user's current loyalty balance
            const { data: profile } = await supabase
                .from('profiles')
                .select('loyalty_points_balance')
                .eq('id', user.id)
                .single();

            const userBalance = profile?.loyalty_points_balance || 0;

            if (loyaltyPointsToUse > userBalance) {
                return errorResponse('Insufficient loyalty points', 400);
            }

            // Calculate subtotal after coupon discount
            const amountAfterCoupon = subtotal - couponDiscount;

            // Calculate max allowed redemption (10% of order)
            const maxAllowedDiscount = amountAfterCoupon * 0.10;
            const maxRedeemablePoints = Math.min(maxAllowedDiscount, userBalance);

            // Validate requested points don't exceed max allowed
            if (loyaltyPointsToUse > maxRedeemablePoints) {
                return errorResponse(
                    `Maximum ${Math.floor(maxRedeemablePoints)} points can be redeemed (10% of order)`,
                    400
                );
            }

            pointsToRedeem = loyaltyPointsToUse;
            loyaltyDiscount = pointsToRedeem; // 1 point = ₹1
        }

        // Handle user offers (50% OFF, BOGO)
        let offerDiscount = 0;
        let appliedOfferId: string | null = null;
        let appliedOfferType: string | null = null;

        const { data: userOffers } = await supabase
            .from('user_offers')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_used', false)
            .gt('expires_at', new Date().toISOString());

        if (userOffers && userOffers.length > 0) {
            // Get item prices sorted ascending
            const itemPrices = (validItems as any[])
                .map((item: any) => item.product?.price || 0)
                .sort((a, b) => a - b);

            // Check for BOGO first (higher value typically)
            const bogoOffer = userOffers.find(o => o.offer_type === 'bogo');
            if (bogoOffer && validItems.length >= 2) {
                // BOGO: Cheapest item is FREE (capped at ₹1000)
                offerDiscount = Math.min(itemPrices[0], 1000);
                appliedOfferId = bogoOffer.id;
                appliedOfferType = 'bogo';
            } else {
                // Check for 50% off (priceSlash)
                const priceSlashOffer = userOffers.find(o => o.offer_type === 'price_slash');
                if (priceSlashOffer) {
                    // 50% OFF the cheapest item
                    offerDiscount = itemPrices[0] * 0.5;
                    appliedOfferId = priceSlashOffer.id;
                    appliedOfferType = 'price_slash';
                }
            }
        }

        const totalAmount = Math.round((subtotal - couponDiscount - loyaltyDiscount - offerDiscount) * 100) / 100;

        // Create order in database
        const adminClient = getAdminClient();

        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .insert({
                user_id: user.id,
                status: 'pending',
                payment_status: 'pending',
                subtotal,
                discount_amount: mrpTotal - subtotal,
                coupon_discount: couponDiscount,
                loyalty_points_used: pointsToRedeem,
                total_amount: totalAmount,
                coupon_id: couponId,
                coupon_code: couponCode?.toUpperCase() || null,
                billing_name: billing.name,
                billing_email: billing.email,
                billing_phone: billing.phone || null,
                billing_address: billing.address
                    ? `${billing.address.line1}${billing.address.line2 ? ', ' + billing.address.line2 : ''}, ${billing.address.city}, ${billing.address.state} - ${billing.address.postalCode}`
                    : null,
                billing_gstn: billing.gstn || null,
                customer_notes: customerNotes || null,
            })
            .select('id, order_number')
            .single();

        if (orderError || !order) {
            console.error('Order creation error:', orderError);
            return errorResponse('Failed to create order', 500);
        }

        // Create order items
        const orderItems = (validItems as any[]).map((item: any) => ({
            order_id: order.id,
            product_id: item.product!.id,
            product_name: item.product!.name,
            product_sku: item.product!.sku,
            product_image: item.product!.main_image_url,
            quantity: item.quantity,
            unit_price: item.product!.price,
            total_price: item.product!.price * item.quantity,
        }));

        const { error: itemsError } = await adminClient
            .from('order_items')
            .insert(orderItems);

        if (itemsError) {
            console.error('Order items error:', itemsError);
            // Rollback order
            await adminClient.from('orders').delete().eq('id', order.id);
            return errorResponse('Failed to create order items', 500);
        }

        // Mark offer as used if applied
        if (appliedOfferId) {
            await adminClient
                .from('user_offers')
                .update({ is_used: true, used_at: new Date().toISOString() })
                .eq('id', appliedOfferId);
        }

        // Create Razorpay order
        const razorpayOrder = await createRazorpayOrder({
            amount: Math.round(totalAmount * 100), // Convert to paise
            receipt: order.order_number,
            notes: {
                order_id: order.id,
                user_id: user.id,
            },
        });

        // Update order with Razorpay order ID
        await adminClient
            .from('orders')
            .update({
                razorpay_order_id: razorpayOrder.id,
                status: 'payment_pending',
            })
            .eq('id', order.id);

        return successResponse({
            orderId: order.id,
            orderNumber: order.order_number,
            razorpayOrderId: razorpayOrder.id,
            razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
            amount: totalAmount,
            currency: 'INR',
            prefill: {
                name: billing.name,
                email: billing.email,
                contact: billing.phone || '',
            },
        });
    } catch (error) {
        console.error('Checkout API error:', error);
        console.error('Error stack:', error instanceof Error ? error.stack : 'No stack');
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Internal server error: ${errorMessage}`, 500);
    }
}
