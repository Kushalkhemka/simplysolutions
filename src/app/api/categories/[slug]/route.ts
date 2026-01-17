import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/api-response';

// GET /api/categories/[slug] - Get category by slug with products
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createClient();

        // Fetch category
        const { data: category, error } = await supabase
            .from('categories')
            .select('*')
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error || !category) {
            return notFoundResponse('Category');
        }

        return successResponse(category);
    } catch (error) {
        console.error('Category detail API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
