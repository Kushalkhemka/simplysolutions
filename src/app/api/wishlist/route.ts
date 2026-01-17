import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

// GET /api/wishlist - Get user's wishlist
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to view wishlist');
        }

        const { data, error } = await supabase
            .from('wishlist')
            .select(`
        id,
        created_at,
        product:products(
          id, sku, name, slug, price, mrp, main_image_url,
          stock_quantity, is_active, avg_rating, review_count
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Wishlist fetch error:', error);
            return errorResponse('Failed to fetch wishlist', 500);
        }

        // Filter out inactive products
        const items = (data || []).filter((item: any) => item.product?.is_active);

        return successResponse({
            items,
            count: items.length,
        });
    } catch (error) {
        console.error('Wishlist API error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/wishlist - Add item to wishlist
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to add to wishlist');
        }

        const { productId } = await request.json();

        if (!productId) {
            return errorResponse('Product ID is required', 400);
        }

        // Check if product exists
        const { data: product } = await supabase
            .from('products')
            .select('id')
            .eq('id', productId)
            .eq('is_active', true)
            .single();

        if (!product) {
            return errorResponse('Product not found', 404);
        }

        // Check if already in wishlist
        const { data: existing } = await supabase
            .from('wishlist')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existing) {
            return successResponse({ message: 'Already in wishlist', id: existing.id });
        }

        // Add to wishlist
        const { data, error } = await supabase
            .from('wishlist')
            .insert({
                user_id: user.id,
                product_id: productId,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Wishlist insert error:', error);
            return errorResponse('Failed to add to wishlist', 500);
        }

        return successResponse({ message: 'Added to wishlist', id: data.id });
    } catch (error) {
        console.error('Wishlist add error:', error);
        return errorResponse('Internal server error', 500);
    }
}
