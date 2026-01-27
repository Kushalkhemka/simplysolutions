import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } from '@/lib/utils/api-response';

async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    return (profile?.role === 'admin' || profile?.role === 'super_admin') ? user : null;
}

interface Params {
    params: Promise<{ id: string }>;
}

// GET /api/admin/orders/[id] - Get order details
export async function GET(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const supabase = await createClient();

        const { data: order, error } = await supabase
            .from('orders')
            .select(`
        *,
        items:order_items(*),
        profile:profiles(full_name, email, phone)
      `)
            .eq('id', id)
            .single();

        if (error || !order) {
            return notFoundResponse('Order not found');
        }

        return successResponse(order);
    } catch (error) {
        console.error('Admin get order error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// PATCH /api/admin/orders/[id] - Update order status
export async function PATCH(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const body = await request.json();
        const adminClient = getAdminClient();

        const updates: Record<string, any> = {};

        if (body.status) {
            updates.status = body.status;
            if (body.status === 'delivered') {
                updates.delivered_at = new Date().toISOString();
                updates.delivery_status = 'delivered';
            }
        }

        if (body.admin_notes) {
            updates.admin_notes = body.admin_notes;
        }

        const { data, error } = await adminClient
            .from('orders')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Order update error:', error);
            return errorResponse('Failed to update order', 500);
        }

        return successResponse(data);
    } catch (error) {
        console.error('Admin update order error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// DELETE /api/admin/orders/[id] - Delete an order
export async function DELETE(request: NextRequest, { params }: Params) {
    try {
        const admin = await checkAdmin();
        if (!admin) return unauthorizedResponse('Admin access required');

        const { id } = await params;
        const adminClient = getAdminClient();

        // Delete order items first (foreign key constraint)
        await adminClient
            .from('order_items')
            .delete()
            .eq('order_id', id);

        // Delete the order
        const { error } = await adminClient
            .from('orders')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Order delete error:', error);
            return errorResponse('Failed to delete order', 500);
        }

        return successResponse({ message: 'Order deleted successfully' });
    } catch (error) {
        console.error('Admin delete order error:', error);
        return errorResponse('Internal server error', 500);
    }
}
