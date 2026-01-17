import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/api-response';

// GET /api/products/[slug] - Get single product by slug
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const { slug } = await params;
        const supabase = await createClient();

        // Fetch product with category
        const { data: product, error } = await supabase
            .from('products')
            .select(`
        *,
        category:categories(id, name, slug, description)
      `)
            .eq('slug', slug)
            .eq('is_active', true)
            .single();

        if (error || !product) {
            return notFoundResponse('Product');
        }

        // Increment view count (fire and forget)
        supabase
            .from('products')
            .update({ view_count: product.view_count + 1 })
            .eq('id', product.id)
            .then(() => { });

        // Fetch reviews for this product
        const { data: reviews } = await supabase
            .from('reviews')
            .select(`
        id,
        rating,
        title,
        content,
        pros,
        cons,
        is_verified_purchase,
        helpful_count,
        created_at,
        user:profiles(id, full_name, avatar_url)
      `)
            .eq('product_id', product.id)
            .eq('is_approved', true)
            .order('created_at', { ascending: false })
            .limit(10);

        // Fetch related products (same category)
        const { data: relatedProducts } = await supabase
            .from('products')
            .select('id, name, slug, price, mrp, main_image_url, avg_rating, review_count')
            .eq('category_id', product.category_id)
            .neq('id', product.id)
            .eq('is_active', true)
            .limit(4);

        return successResponse({
            ...product,
            reviews: reviews || [],
            relatedProducts: relatedProducts || [],
        });
    } catch (error) {
        console.error('Product detail API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
