import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

// GET /api/orders/[id] - Get order details with license keys
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to view order');
        }

        // Fetch order
        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(
          id,
          product_id,
          product_name,
          product_sku,
          product_image,
          quantity,
          unit_price,
          total_price,
          license_keys,
          status
        )
      `)
            .eq('id', id)
            .eq('user_id', user.id)
            .single();

        if (error || !order) {
            return notFoundResponse('Order');
        }

        return successResponse(order);
    } catch (error) {
        console.error('Order detail API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
