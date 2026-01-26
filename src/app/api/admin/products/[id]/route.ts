import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

// Middleware to check admin
async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return (profile?.role === 'admin' || profile?.role === 'super_admin') ? user : null;
}

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/admin/products/[id] - Get single product
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const supabase = await createClient();

        const { data, error } = await supabase
            .from('products')
            .select('*, category:categories(*)')
            .eq('id', id)
            .single();

        if (error || !data) {
            return notFoundResponse('Product not found');
        }

        return successResponse(data);
    } catch (error) {
        console.error('Admin get product error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PATCH /api/admin/products/[id] - Update product
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const body = await request.json();
        const adminClient = getAdminClient();

        // Build update object
        const updates: Record<string, any> = {};
        const allowedFields = [
            'name', 'description', 'short_description', 'price', 'mrp',
            'category_id', 'main_image_url', 'image_urls', 'bullet_points',
            'is_active', 'is_featured', 'is_bestseller', 'stock_quantity'
        ];

        for (const field of allowedFields) {
            if (body[field] !== undefined) {
                updates[field] = body[field];
            }
        }

        if (Object.keys(updates).length === 0) {
            return errorResponse('No updates provided', 400);
        }

        const { data, error } = await adminClient
            .from('products')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Product update error:', error);
            return errorResponse('Failed to update product', 500);
        }

        return successResponse(data);
    } catch (error) {
        console.error('Admin update product error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /api/admin/products/[id] - Delete product
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const adminClient = getAdminClient();

        // Soft delete by setting is_active to false
        const { error } = await adminClient
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (error) {
            console.error('Product delete error:', error);
            return errorResponse('Failed to delete product', 500);
        }

        return successResponse({ message: 'Product deleted' });
    } catch (error) {
        console.error('Admin delete product error:', error);
        return errorResponse('Internal server error', 500);
    }
}
