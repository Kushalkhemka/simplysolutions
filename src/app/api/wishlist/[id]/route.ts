import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

// DELETE /api/wishlist/[id] - Remove item from wishlist
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Please login');
        }

        const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            return errorResponse('Failed to remove from wishlist', 500);
        }

        return successResponse({ message: 'Removed from wishlist' });
    } catch (error) {
        console.error('Wishlist delete error:', error);
        return errorResponse('Internal server error', 500);
    }
}
