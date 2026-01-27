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
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
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
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return unauthorizedResponse('Admin access required');
        }

        const body = await request.json();

        // Extract only the fields that exist in the database table
        const {
            id,
            is_active,
            duration_hours,
            discount_value,
            max_discount_cap,
            special_price,
            title,
            description,
            product_id
        } = body;

        if (!id) {
            return errorResponse('Offer template ID is required', 400);
        }

        // Only include valid database fields
        const updates: Record<string, unknown> = {};
        if (is_active !== undefined) updates.is_active = is_active;
        if (duration_hours !== undefined) updates.duration_hours = duration_hours;
        if (discount_value !== undefined) updates.discount_value = discount_value;
        if (max_discount_cap !== undefined) updates.max_discount_cap = max_discount_cap;
        if (special_price !== undefined) updates.special_price = special_price;
        if (title !== undefined) updates.title = title;
        if (description !== undefined) updates.description = description;
        if (product_id !== undefined) updates.product_id = product_id;

        const { data, error } = await supabase
            .from('welcome_offer_templates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Database update error:', error);
            throw error;
        }

        return successResponse({ template: data });
    } catch (error) {
        console.error('Update welcome offer error:', error);
        return errorResponse('Failed to update offer', 500);
    }
}
