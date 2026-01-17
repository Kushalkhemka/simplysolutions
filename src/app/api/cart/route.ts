import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { addToCartSchema, updateCartItemSchema } from '@/lib/utils/validation';
import { cookies } from 'next/headers';
import { nanoid } from 'nanoid';

// Helper to get or create session ID for guest users
async function getSessionId(): Promise<string> {
    const cookieStore = await cookies();
    let sessionId = cookieStore.get('cart_session')?.value;

    if (!sessionId) {
        sessionId = nanoid();
        cookieStore.set('cart_session', sessionId, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 30, // 30 days
        });
    }

    return sessionId;
}

// GET /api/cart - Get cart items
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const sessionId = await getSessionId();

        let query = supabase
            .from('cart_items')
            .select(`
        id,
        quantity,
        added_at,
        product:products(
          id, sku, name, slug, price, mrp, main_image_url, 
          stock_quantity, is_active
        )
      `);

        if (user) {
            query = query.eq('user_id', user.id);
        } else {
            query = query.eq('session_id', sessionId);
        }

        const { data, error } = await query.order('added_at', { ascending: false });

        if (error) {
            console.error('Cart fetch error:', error);
            return errorResponse('Failed to fetch cart', 500);
        }

        // Filter out inactive products and calculate totals
        const items = (data || []).filter((item: any) => item.product?.is_active);
        const subtotal = items.reduce((sum: number, item: any) => {
            return sum + (item.product?.price || 0) * item.quantity;
        }, 0);
        const mrpTotal = items.reduce((sum: number, item: any) => {
            return sum + (item.product?.mrp || 0) * item.quantity;
        }, 0);

        return successResponse({
            items,
            itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
            subtotal,
            mrpTotal,
            discount: mrpTotal - subtotal,
        });
    } catch (error) {
        console.error('Cart API error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/cart - Add item to cart
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = await getSessionId();

        const body = await request.json();
        const parsed = addToCartSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid request data', 400);
        }

        const { productId, quantity } = parsed.data;

        // Check if product exists and is in stock
        const { data: product } = await supabase
            .from('products')
            .select('id, stock_quantity, is_active')
            .eq('id', productId)
            .single();

        if (!product || !product.is_active) {
            return errorResponse('Product not found', 404);
        }

        if (product.stock_quantity < quantity) {
            return errorResponse('Insufficient stock', 400);
        }

        // Check if item already in cart
        let existingQuery = supabase
            .from('cart_items')
            .select('id, quantity')
            .eq('product_id', productId);

        if (user) {
            existingQuery = existingQuery.eq('user_id', user.id);
        } else {
            existingQuery = existingQuery.eq('session_id', sessionId);
        }

        const { data: existing } = await existingQuery.single();

        if (existing) {
            // Update quantity
            const newQuantity = Math.min(existing.quantity + quantity, 10); // Max 10 per item
            const { error } = await supabase
                .from('cart_items')
                .update({ quantity: newQuantity })
                .eq('id', existing.id);

            if (error) {
                return errorResponse('Failed to update cart', 500);
            }
        } else {
            // Insert new item
            const { error } = await supabase
                .from('cart_items')
                .insert({
                    user_id: user?.id || null,
                    session_id: user ? null : sessionId,
                    product_id: productId,
                    quantity,
                });

            if (error) {
                console.error('Cart insert error:', error);
                return errorResponse('Failed to add to cart', 500);
            }
        }

        return successResponse({ message: 'Added to cart' });
    } catch (error) {
        console.error('Cart add error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /api/cart - Clear entire cart
export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = await getSessionId();

        let query = supabase.from('cart_items').delete();

        if (user) {
            query = query.eq('user_id', user.id);
        } else {
            query = query.eq('session_id', sessionId);
        }

        const { error } = await query;

        if (error) {
            return errorResponse('Failed to clear cart', 500);
        }

        return successResponse({ message: 'Cart cleared' });
    } catch (error) {
        console.error('Cart clear error:', error);
        return errorResponse('Internal server error', 500);
    }
}
