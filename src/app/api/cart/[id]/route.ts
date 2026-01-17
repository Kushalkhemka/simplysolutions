import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, notFoundResponse } from '@/lib/utils/api-response';
import { updateCartItemSchema } from '@/lib/utils/validation';
import { cookies } from 'next/headers';

async function getSessionId(): Promise<string | undefined> {
    const cookieStore = await cookies();
    return cookieStore.get('cart_session')?.value;
}

// PATCH /api/cart/[id] - Update cart item quantity
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = await getSessionId();

        const body = await request.json();
        const parsed = updateCartItemSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid quantity', 400);
        }

        // Verify ownership
        let query = supabase
            .from('cart_items')
            .select('id, product_id')
            .eq('id', id);

        if (user) {
            query = query.eq('user_id', user.id);
        } else if (sessionId) {
            query = query.eq('session_id', sessionId);
        } else {
            return notFoundResponse('Cart item');
        }

        const { data: item } = await query.single();

        if (!item) {
            return notFoundResponse('Cart item');
        }

        // Check stock
        const { data: product } = await supabase
            .from('products')
            .select('stock_quantity')
            .eq('id', item.product_id)
            .single();

        if (product && parsed.data.quantity > product.stock_quantity) {
            return errorResponse('Insufficient stock', 400);
        }

        // Update quantity
        const { error } = await supabase
            .from('cart_items')
            .update({ quantity: parsed.data.quantity })
            .eq('id', id);

        if (error) {
            return errorResponse('Failed to update cart', 500);
        }

        return successResponse({ message: 'Cart updated' });
    } catch (error) {
        console.error('Cart update error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /api/cart/[id] - Remove item from cart
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        const sessionId = await getSessionId();

        let query = supabase
            .from('cart_items')
            .delete()
            .eq('id', id);

        if (user) {
            query = query.eq('user_id', user.id);
        } else if (sessionId) {
            query = query.eq('session_id', sessionId);
        } else {
            return notFoundResponse('Cart item');
        }

        const { error } = await query;

        if (error) {
            return errorResponse('Failed to remove item', 500);
        }

        return successResponse({ message: 'Item removed' });
    } catch (error) {
        console.error('Cart delete error:', error);
        return errorResponse('Internal server error', 500);
    }
}
