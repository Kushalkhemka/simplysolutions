import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

// GET /api/auth/me - Get current user profile
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        // Get profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        // If profile is missing, still return basic user info (profile might not exist yet)
        if (error) {
            console.warn('Profile fetch warning:', error.message);
            // Return basic user info even if profile fetch fails
            return successResponse({
                user: {
                    id: user.id,
                    email: user.email,
                    full_name: user.email?.split('@')[0] || 'User',
                    role: 'customer',
                },
            });
        }

        return successResponse({
            user: {
                id: user.id,
                email: user.email,
                ...profile,
            },
        });
    } catch (error) {
        console.error('Me API error:', error);
        return errorResponse('Internal server error', 500);
    }
}
