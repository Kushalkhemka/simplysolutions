import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET /api/bundles - Fetch all active bundles
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;
        const featured = searchParams.get('featured') === 'true';

        let query = supabase
            .from('bundles')
            .select('*')
            .eq('is_active', true)
            .order('display_order', { ascending: true });

        if (featured) {
            query = query.eq('is_featured', true);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching bundles:', error);
            return errorResponse('Failed to fetch bundles', 500);
        }

        return successResponse(data || []);
    } catch (error) {
        console.error('Bundles API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
