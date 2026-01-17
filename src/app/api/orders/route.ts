import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { getPaginationParams, paginatedResponse } from '@/lib/utils/api-response';
import { NextRequest } from 'next/server';

// GET /api/orders - Get user's orders
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to view orders');
        }

        const searchParams = request.nextUrl.searchParams;
        const { page, limit, offset } = getPaginationParams(searchParams);

        const { data, error, count } = await supabase
            .from('orders')
            .select(`
        id,
        order_number,
        status,
        payment_status,
        delivery_status,
        subtotal,
        discount_amount,
        total_amount,
        created_at,
        items:order_items(
          id,
          product_name,
          product_image,
          quantity,
          unit_price,
          total_price,
          status
        )
      `, { count: 'exact' })
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Orders fetch error:', error);
            return errorResponse('Failed to fetch orders', 500);
        }

        return paginatedResponse(data || [], {
            page,
            limit,
            total: count || 0,
        });
    } catch (error) {
        console.error('Orders API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
