import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET /api/deals - Get all active deals
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type'); // lightning, daily, weekly

        const now = new Date().toISOString();

        let query = supabase
            .from('deals')
            .select(`
        *,
        product:products(
          id, name, slug, main_image_url, price, mrp,
          avg_rating, review_count, stock_quantity
        )
      `)
            .eq('is_active', true)
            .lte('starts_at', now)
            .gte('ends_at', now)
            .order('display_order', { ascending: true });

        if (type) {
            query = query.eq('deal_type', type);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Deals fetch error:', error);
            return errorResponse('Failed to fetch deals', 500);
        }

        return successResponse(data || []);
    } catch (error) {
        console.error('Deals API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
