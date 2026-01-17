import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// GET /api/recommendations - Get product recommendations
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const excludeId = searchParams.get('excludeId');
        const categoryId = searchParams.get('categoryId');
        const limit = parseInt(searchParams.get('limit') || '4');

        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const adminClient = createAdminClient();

        let recommendations: any[] = [];

        // If user is logged in, try to get personalized recommendations
        if (user) {
            // Get user's recent orders to understand preferences
            const { data: recentOrders } = await adminClient
                .from('order_items')
                .select('product_id, product:products(category_id)')
                .eq('order_id', adminClient.from('orders').select('id').eq('user_id', user.id).limit(5) as any)
                .limit(10);

            // Get products from similar categories (excluding already purchased)
            const purchasedIds = recentOrders?.map(o => o.product_id) || [];
            const categoryIds = [...new Set(recentOrders?.map(o => (o.product as any)?.category_id).filter(Boolean) || [])];

            if (categoryIds.length > 0) {
                const { data: catProducts } = await adminClient
                    .from('products')
                    .select('id, name, slug, price, mrp, main_image_url, brand, is_featured, is_bestseller, avg_rating, review_count')
                    .in('category_id', categoryIds)
                    .eq('is_active', true)
                    .not('id', 'in', `(${[excludeId, ...purchasedIds].filter(Boolean).join(',')})`)
                    .order('is_bestseller', { ascending: false })
                    .limit(limit);

                if (catProducts && catProducts.length > 0) {
                    recommendations = catProducts;
                }
            }
        }

        // If no personalized recommendations, fall back to bestsellers/featured
        if (recommendations.length < limit) {
            let query = adminClient
                .from('products')
                .select('id, name, slug, price, mrp, main_image_url, brand, is_featured, is_bestseller, avg_rating, review_count')
                .eq('is_active', true);

            if (excludeId) {
                query = query.neq('id', excludeId);
            }

            if (categoryId) {
                query = query.eq('category_id', categoryId);
            }

            // Exclude already added recommendations
            const existingIds = recommendations.map(r => r.id);
            if (existingIds.length > 0) {
                query = query.not('id', 'in', `(${existingIds.join(',')})`);
            }

            const { data: fallbackProducts } = await query
                .or('is_bestseller.eq.true,is_featured.eq.true')
                .order('sold_count', { ascending: false })
                .limit(limit - recommendations.length);

            if (fallbackProducts) {
                recommendations = [...recommendations, ...fallbackProducts];
            }
        }

        // If still not enough, get random active products
        if (recommendations.length < limit) {
            const existingIds = recommendations.map(r => r.id);
            const excludeList = [excludeId, ...existingIds].filter(Boolean);

            let query = adminClient
                .from('products')
                .select('id, name, slug, price, mrp, main_image_url, brand, is_featured, is_bestseller, avg_rating, review_count')
                .eq('is_active', true);

            if (excludeList.length > 0) {
                query = query.not('id', 'in', `(${excludeList.join(',')})`);
            }

            const { data: randomProducts } = await query
                .order('created_at', { ascending: false })
                .limit(limit - recommendations.length);

            if (randomProducts) {
                recommendations = [...recommendations, ...randomProducts];
            }
        }

        return NextResponse.json({ success: true, data: recommendations.slice(0, limit) });
    } catch (error) {
        console.error('Recommendations error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
