import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// POST /api/auth/logout - Logout user
export async function POST() {
    try {
        const supabase = await createClient();

        const { error } = await supabase.auth.signOut();

        if (error) {
            console.error('Logout error:', error);
            return errorResponse('Failed to logout', 500);
        }

        return successResponse({ message: 'Logged out successfully' });
    } catch (error) {
        console.error('Logout API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
