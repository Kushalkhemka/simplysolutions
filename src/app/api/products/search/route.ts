import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET /api/products/search - Search products
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const q = searchParams.get('q');
        const limit = Math.min(parseInt(searchParams.get('limit') || '10'), 20);

        if (!q || q.length < 2) {
            return successResponse([]);
        }

        // Search in name, description, and keywords
        const { data, error } = await supabase
            .from('products')
            .select('id, name, slug, main_image_url, price, mrp')
            .eq('is_active', true)
            .or(`name.ilike.%${q}%,description.ilike.%${q}%,brand.ilike.%${q}%`)
            .order('sold_count', { ascending: false })
            .limit(limit);

        if (error) {
            console.error('Search error:', error);
            return errorResponse('Search failed', 500);
        }

        return successResponse(data || []);
    } catch (error) {
        console.error('Search API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
