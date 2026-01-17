import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { createProductSchema } from '@/lib/utils/validation';
import slugify from 'slugify';
import { nanoid } from 'nanoid';

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

    return profile?.role === 'admin' ? user : null;
}

// GET /api/admin/products - List all products
export async function GET(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const supabase = await createClient();
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        const { data, error, count } = await supabase
            .from('products')
            .select('*, category:categories(name)', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            return errorResponse('Failed to fetch products', 500);
        }

        return successResponse({
            products: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit),
            },
        });
    } catch (error) {
        console.error('Admin products error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/admin/products - Create new product
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const body = await request.json();
        const parsed = createProductSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid product data', 400);
        }

        const data = parsed.data;
        const adminClient = getAdminClient();

        // Generate slug
        const slug = slugify(data.name, { lower: true, strict: true });
        const sku = data.sku || `SKU_${nanoid(8)}`;

        const { data: product, error } = await adminClient
            .from('products')
            .insert({
                sku,
                name: data.name,
                slug,
                description: data.description,
                short_description: data.shortDescription,
                category_id: data.categoryId,
                price: data.price,
                mrp: data.mrp,
                main_image_url: data.mainImageUrl,
                image_urls: data.imageUrls || [],
                bullet_points: data.bulletPoints || [],
                meta_keywords: data.keywords || [],
                is_active: data.isActive ?? true,
                is_featured: data.isFeatured ?? false,
            })
            .select()
            .single();

        if (error) {
            console.error('Product create error:', error);
            return errorResponse('Failed to create product', 500);
        }

        return successResponse(product);
    } catch (error) {
        console.error('Admin create product error:', error);
        return errorResponse('Internal server error', 500);
    }
}
