import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { validateCouponSchema } from '@/lib/utils/validation';

// POST /api/coupons/validate - Validate a coupon code
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const body = await request.json();
        const parsed = validateCouponSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid request', 400);
        }

        const { code, subtotal } = parsed.data;

        // Find coupon
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*')
            .eq('code', code.toUpperCase())
            .eq('is_active', true)
            .single();

        if (error || !coupon) {
            return errorResponse('Invalid coupon code', 400);
        }

        // Check validity period
        const now = new Date();
        const validFrom = new Date(coupon.valid_from);
        const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

        if (now < validFrom) {
            return errorResponse('Coupon is not yet active', 400);
        }

        if (validUntil && now > validUntil) {
            return errorResponse('Coupon has expired', 400);
        }

        // Check usage limit
        if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
            return errorResponse('Coupon usage limit reached', 400);
        }

        // Check minimum order amount
        if (subtotal < coupon.min_order_amount) {
            return errorResponse(
                `Minimum order amount is ₹${coupon.min_order_amount}`,
                400
            );
        }

        // Check per-user limit
        if (user && coupon.per_user_limit) {
            const { count } = await supabase
                .from('coupon_usage')
                .select('*', { count: 'exact', head: true })
                .eq('coupon_id', coupon.id)
                .eq('user_id', user.id);

            if (count && count >= coupon.per_user_limit) {
                return errorResponse('You have already used this coupon', 400);
            }
        }

        // Check first order only
        if (coupon.first_order_only && user) {
            const { count } = await supabase
                .from('orders')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('status', 'delivered');

            if (count && count > 0) {
                return errorResponse('This coupon is for first orders only', 400);
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = (subtotal * coupon.discount_value) / 100;
            if (coupon.max_discount_amount) {
                discountAmount = Math.min(discountAmount, coupon.max_discount_amount);
            }
        } else {
            discountAmount = coupon.discount_value;
        }

        // Don't exceed subtotal
        discountAmount = Math.min(discountAmount, subtotal);

        return successResponse({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discountType: coupon.discount_type,
                discountValue: coupon.discount_value,
                maxDiscount: coupon.max_discount_amount,
            },
            discountAmount: Math.round(discountAmount * 100) / 100,
            finalAmount: Math.round((subtotal - discountAmount) * 100) / 100,
        });
    } catch (error) {
        console.error('Coupon validation error:', error);
        return errorResponse('Internal server error', 500);
    }
}
