import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { createCouponSchema } from '@/lib/utils/validation';

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return profile?.role === 'admin' ? user : null;
}

// GET /api/admin/coupons - List all coupons
export async function GET() {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const supabase = await createClient();
        const { data, error } = await supabase
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            return errorResponse('Failed to fetch coupons', 500);
        }

        return successResponse(data || []);
    } catch (error) {
        console.error('Admin coupons error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/admin/coupons - Create coupon
export async function POST(request: NextRequest) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const body = await request.json();
        const parsed = createCouponSchema.safeParse(body);

        if (!parsed.success) {
            return errorResponse('Invalid coupon data', 400);
        }

        const data = parsed.data;
        const adminClient = getAdminClient();

        const { data: coupon, error } = await adminClient
            .from('coupons')
            .insert({
                code: data.code.toUpperCase(),
                description: data.description,
                discount_type: data.discountType,
                discount_value: data.discountValue,
                max_discount_amount: data.maxDiscountAmount,
                min_order_amount: data.minOrderAmount || 0,
                usage_limit: data.usageLimit,
                per_user_limit: data.perUserLimit || 1,
                valid_from: data.validFrom || new Date().toISOString(),
                valid_until: data.validUntil,
                is_active: data.isActive ?? true,
                created_by: admin.id,
            })
            .select()
            .single();

        if (error) {
            if (error.code === '23505') {
                return errorResponse('Coupon code already exists', 400);
            }
            console.error('Coupon create error:', error);
            return errorResponse('Failed to create coupon', 500);
        }

        return successResponse(coupon);
    } catch (error) {
        console.error('Admin create coupon error:', error);
        return errorResponse('Internal server error', 500);
    }
}
