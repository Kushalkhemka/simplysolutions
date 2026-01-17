import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET /api/categories - List all active categories
export async function GET() {
    try {
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (error) {
            console.error('Categories fetch error:', error);
            return errorResponse('Failed to fetch categories', 500);
        }

        return successResponse(data);
    } catch (error) {
        console.error('Categories API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
