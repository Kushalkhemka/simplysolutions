import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
    successResponse,
    errorResponse,
    paginatedResponse,
    getPaginationParams
} from '@/lib/utils/api-response';
import { productFiltersSchema } from '@/lib/utils/validation';

// GET /api/products - List products with filtering, search, pagination
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const searchParams = request.nextUrl.searchParams;

        // Parse pagination
        const { page, limit, offset } = getPaginationParams(searchParams);

        // Parse filters
        const filters = productFiltersSchema.safeParse({
            category: searchParams.get('category'),
            minPrice: searchParams.get('minPrice'),
            maxPrice: searchParams.get('maxPrice'),
            brand: searchParams.get('brand'),
            rating: searchParams.get('rating'),
            inStock: searchParams.get('inStock'),
            featured: searchParams.get('featured'),
            sortBy: searchParams.get('sortBy'),
            search: searchParams.get('search'),
        });

        // Build query
        let query = supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug)
      `, { count: 'exact' })
            .eq('is_active', true);

        // Apply filters
        if (filters.success) {
            const f = filters.data;

            if (f.category) {
                // Get category by slug first
                const { data: cat } = await supabase
                    .from('categories')
                    .select('id')
                    .eq('slug', f.category)
                    .single();

                if (cat) {
                    query = query.eq('category_id', cat.id);
                }
            }

            if (f.minPrice !== undefined) {
                query = query.gte('price', f.minPrice);
            }

            if (f.maxPrice !== undefined) {
                query = query.lte('price', f.maxPrice);
            }

            if (f.brand) {
                query = query.ilike('brand', `%${f.brand}%`);
            }

            if (f.rating !== undefined) {
                query = query.gte('avg_rating', f.rating);
            }

            if (f.inStock === true) {
                query = query.gt('stock_quantity', 0);
            }

            if (f.featured === true) {
                query = query.eq('is_featured', true);
            }

            if (f.search) {
                query = query.or(`name.ilike.%${f.search}%,description.ilike.%${f.search}%,keywords.cs.{${f.search}}`);
            }

            // Apply sorting
            switch (f.sortBy) {
                case 'price_asc':
                    query = query.order('price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('price', { ascending: false });
                    break;
                case 'name':
                    query = query.order('name', { ascending: true });
                    break;
                case 'rating':
                    query = query.order('avg_rating', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                case 'bestseller':
                    query = query.order('sold_count', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }
        } else {
            query = query.order('created_at', { ascending: false });
        }

        // Apply pagination
        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) {
            console.error('Products fetch error:', error);
            return errorResponse('Failed to fetch products', 500);
        }

        return paginatedResponse(data || [], {
            page,
            limit,
            total: count || 0,
        });
    } catch (error) {
        console.error('Products API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
