import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { uploadLicenseKeysSchema } from '@/lib/utils/validation';

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return (profile?.role === 'admin' || profile?.role === 'super_admin') ? user : null;
}

// GET /api/admin/inventory - List license keys
export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');
        const status = searchParams.get('status');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        let query = supabase
            .from('license_keys')
            .select('*, product:products(name, sku)', { count: 'exact' });

        if (productId) query = query.eq('product_id', productId);
        if (status) query = query.eq('status', status);

        const { data, error, count } = await query
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return errorResponse('Failed to fetch inventory', 500);
        }

        return successResponse({
            keys: data || [],
            pagination: { page, limit, total: count || 0, totalPages: Math.ceil((count || 0) / limit) },
        });
    } catch (error) {
        console.error('Admin inventory error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/admin/inventory - Upload license keys
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const body = await request.json();
        const parsed = uploadLicenseKeysSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid data', 400);
        }

        const { productId, licenseKeys } = parsed.data;
        const adminClient = getAdminClient();

        // Check product exists
        const { data: product } = await adminClient
            .from('products')
            .select('id')
            .eq('id', productId)
            .single();

        if (!product) {
            return errorResponse('Product not found', 404);
        }

        // Insert license keys
        const keysToInsert = licenseKeys.map(key => ({
            product_id: productId,
            license_key: key.trim(),
            status: 'available',
        }));

        const { data, error } = await adminClient
            .from('license_keys')
            .insert(keysToInsert)
            .select();

        if (error) {
            console.error('License key insert error:', error);
            return errorResponse('Failed to upload license keys', 500);
        }

        // Update product stock
        await adminClient
            .from('products')
            .update({ stock_quantity: data.length })
            .eq('id', productId);

        return successResponse({
            message: `Successfully uploaded ${data.length} license keys`,
            count: data.length,
        });
    } catch (error) {
        console.error('Admin inventory upload error:', error);
        return errorResponse('Internal server error', 500);
    }
}
