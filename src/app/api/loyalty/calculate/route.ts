import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const calculateSchema = z.object({
    orderAmount: z.number().min(0, 'Order amount must be positive'),
});

// POST /api/loyalty/calculate - Calculate max redeemable points for an order
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login');
        }

        const body = await request.json();
        const parsed = calculateSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid order amount', 400);
        }

        const { orderAmount } = parsed.data;

        // Get user's current balance
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('loyalty_points_balance')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return errorResponse('Failed to fetch loyalty balance', 500);
        }

        const userBalance = profile.loyalty_points_balance || 0;

        // Calculate max redeemable (10% of order amount or user's balance, whichever is lower)
        const maxDiscountAllowed = orderAmount * 0.10; // 10% of order
        const maxRedeemablePoints = Math.min(maxDiscountAllowed, userBalance);

        // Round to 2 decimal places
        const maxRedeemable = Math.floor(maxRedeemablePoints * 100) / 100;

        return successResponse({
            userBalance,
            orderAmount,
            maxRedeemablePoints: maxRedeemable,
            maxDiscountValue: maxRedeemable, // 1 point = ₹1
            percentageAllowed: 10,
        });
    } catch (error) {
        console.error('Loyalty calculate API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
