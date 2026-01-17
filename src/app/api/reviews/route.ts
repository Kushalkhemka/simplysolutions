import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { createReviewSchema as reviewSchema } from '@/lib/utils/validation';

// POST /api/reviews - Submit a review
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login to submit a review');
        }

        const body = await request.json();
        const parsed = reviewSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid review data', 400);
        }

        const { productId, rating, title, content, pros, cons } = parsed.data;

        // Check if user has purchased this product
        const { data: orders } = await supabase
            .from('orders')
            .select(`
        items:order_items(product_id)
      `)
            .eq('user_id', user.id)
            .eq('status', 'delivered');

        const hasPurchased = orders?.some((order: any) =>
            order.items?.some((item: any) => item.product_id === productId)
        );

        // Check if user already reviewed this product
        const { data: existingReview } = await supabase
            .from('reviews')
            .select('id')
            .eq('user_id', user.id)
            .eq('product_id', productId)
            .single();

        if (existingReview) {
            return errorResponse('You have already reviewed this product', 400);
        }

        // Create review
        const { data: review, error } = await supabase
            .from('reviews')
            .insert({
                user_id: user.id,
                product_id: productId,
                rating,
                title,
                content,
                pros: pros || [],
                cons: cons || [],
                is_verified_purchase: hasPurchased || false,
                is_approved: true, // Auto-approve for now
            })
            .select()
            .single();

        if (error) {
            console.error('Review insert error:', error);
            return errorResponse('Failed to submit review', 500);
        }

        return successResponse({
            message: 'Review submitted successfully',
            review,
        });
    } catch (error) {
        console.error('Review API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
