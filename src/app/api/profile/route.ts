import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { z } from 'zod';

const updateProfileSchema = z.object({
    full_name: z.string().min(2).optional(),
    phone: z.string().optional(),
});

// GET /api/profile - Get current user profile
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (error) {
            return errorResponse('Failed to fetch profile', 500);
        }

        return successResponse({ ...profile, email: user.email });
    } catch (error) {
        console.error('Profile API error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PATCH /api/profile - Update current user profile
export async function PATCH(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const parsed = updateProfileSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid data', 400);
        }

        const updates: Record<string, any> = {};
        if (parsed.data.full_name) updates.full_name = parsed.data.full_name;
        if (parsed.data.phone !== undefined) updates.phone = parsed.data.phone;

        const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

        if (error) {
            return errorResponse('Failed to update profile', 500);
        }

        return successResponse(data);
    } catch (error) {
        console.error('Profile update error:', error);
        return errorResponse('Internal server error', 500);
    }
}
