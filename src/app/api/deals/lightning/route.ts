import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET /api/deals/lightning - Get lightning deals
export async function GET() {
    try {
        const supabase = await createClient();
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('deals')
            .select(`
        *,
        product:products(
          id, name, slug, main_image_url, price, mrp,
          avg_rating, review_count, stock_quantity
        )
      `)
            .eq('is_active', true)
            .eq('deal_type', 'lightning')
            .lte('starts_at', now)
            .gte('ends_at', now)
            .order('ends_at', { ascending: true })
            .limit(10);

        if (error) {
            console.error('Lightning deals fetch error:', error);
            return errorResponse('Failed to fetch deals', 500);
        }

        return successResponse(data || []);
    } catch (error) {
        console.error('Lightning deals API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
