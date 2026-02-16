import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/admin/products/remap-orders - Remap amazon_orders FSN for selected orders
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const body = await request.json();
        const { fsn, orderIds } = body;

        if (!fsn || typeof fsn !== 'string') {
            return NextResponse.json({ success: false, error: 'FSN is required' }, { status: 400 });
        }

        if (!orderIds || !Array.isArray(orderIds) || orderIds.length === 0) {
            return NextResponse.json({ success: false, error: 'At least one order ID is required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Update all selected orders' FSN
        const { data, error } = await adminClient
            .from('amazon_orders')
            .update({ fsn: fsn.trim() })
            .in('order_id', orderIds)
            .select('order_id, fsn');

        if (error) {
            console.error('Remap orders error:', error);
            return NextResponse.json({ success: false, error: 'Failed to remap orders: ' + error.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: {
                updatedCount: data?.length || 0,
                fsn,
                updatedOrders: data?.map(o => o.order_id) || [],
            },
        });
    } catch (error) {
        console.error('Remap orders error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}

// GET /api/admin/products/remap-orders?search=xxx - Search amazon_orders by order_id or fsn
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        // Check if admin
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
            return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search')?.trim();

        if (!search || search.length < 2) {
            return NextResponse.json({ success: false, error: 'Search term must be at least 2 characters' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Search orders by order_id or fsn (case-insensitive)
        const { data, error } = await adminClient
            .from('amazon_orders')
            .select('order_id, fsn, order_date, buyer_email, fulfillment_type')
            .or(`order_id.ilike.%${search}%,fsn.ilike.%${search}%`)
            .order('order_date', { ascending: false })
            .limit(50);

        if (error) {
            console.error('Search orders error:', error);
            return NextResponse.json({ success: false, error: 'Failed to search orders' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data || [],
        });
    } catch (error) {
        console.error('Search orders error:', error);
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
    }
}
