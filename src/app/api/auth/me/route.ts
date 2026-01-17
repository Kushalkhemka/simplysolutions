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

        if (error) {
            console.error('Profile fetch error:', error);
            return errorResponse('Failed to fetch profile', 500);
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
