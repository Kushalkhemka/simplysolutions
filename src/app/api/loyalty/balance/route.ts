import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse, getPaginationParams, paginatedResponse } from '@/lib/utils/api-response';

// GET /api/loyalty/balance - Get user's loyalty points balance and transactions
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to view loyalty points');
        }

        // Get user's current balance from profile
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('loyalty_points_balance')
            .eq('id', user.id)
            .single();

        if (profileError) {
            console.error('Profile fetch error:', profileError);
            return errorResponse('Failed to fetch loyalty balance', 500);
        }

        // Get transaction history with pagination
        const searchParams = request.nextUrl.searchParams;
        const { page, limit, offset } = getPaginationParams(searchParams);

        const { data: transactions, error: transError, count } = await supabase
            .from('loyalty_transactions')
            .select('*', { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (transError) {
            console.error('Transactions fetch error:', transError);
            return errorResponse('Failed to fetch transaction history', 500);
        }

        return successResponse({
            balance: profile.loyalty_points_balance || 0,
            transactions: paginatedResponse(transactions || [], {
                page,
                limit,
                total: count || 0,
            }),
        });
    } catch (error) {
        console.error('Loyalty balance API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
