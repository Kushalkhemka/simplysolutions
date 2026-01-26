import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

// GET /api/admin/welcome-offers - Get all offer templates
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Unauthorized');
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return unauthorizedResponse('Admin access required');
        }

        const { data: templates, error } = await supabase
            .from('welcome_offer_templates')
            .select(`
                *,
                product:products(id, name, slug, price, main_image_url)
            `)
            .order('offer_type');

        if (error) throw error;

        return successResponse({ templates });
    } catch (error) {
        console.error('Get welcome offers error:', error);
        return errorResponse('Failed to fetch offers', 500);
    }
}

// PUT /api/admin/welcome-offers - Update offer template
export async function PUT(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse('Unauthorized');
        }

        // Check if user is admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin, is_super_admin')
            .eq('id', user.id)
            .single();

        if (!profile?.is_admin && !profile?.is_super_admin) {
            return unauthorizedResponse('Admin access required');
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return errorResponse('Offer template ID is required', 400);
        }

        const { data, error } = await supabase
            .from('welcome_offer_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return successResponse({ template: data });
    } catch (error) {
        console.error('Update welcome offer error:', error);
        return errorResponse('Failed to update offer', 500);
    }
}
