import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

// Helper to check if user is super_admin
async function checkSuperAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Unauthorized', status: 401, user: null, isSuperAdmin: false };
    }

    const adminClient = getAdminClient();
    const { data: profile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!profile || (profile.role !== 'super_admin' && profile.role !== 'admin')) {
        return { error: 'Unauthorized - Admin access required', status: 403, user, isSuperAdmin: false };
    }

    return { error: null, user, isSuperAdmin: profile.role === 'super_admin', role: profile.role };
}

// GET - List all users (admin/super_admin)
export async function GET() {
    try {
        const { error, status } = await checkSuperAdmin();
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        const adminClient = getAdminClient();
        const { data: profiles, error: fetchError } = await adminClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false });

        if (fetchError) {
            console.error('Error fetching profiles:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 });
        }

        // Get order counts per customer
        const { data: orderCounts } = await adminClient
            .from('orders')
            .select('user_id')
            .eq('status', 'delivered');

        const orderCountMap = (orderCounts || []).reduce((acc: Record<string, number>, order: any) => {
            acc[order.user_id] = (acc[order.user_id] || 0) + 1;
            return acc;
        }, {});

        const usersWithOrders = profiles?.map(profile => ({
            ...profile,
            order_count: orderCountMap[profile.id] || 0
        }));

        return NextResponse.json({ users: usersWithOrders });
    } catch (error) {
        console.error('GET users error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PATCH - Update user role (super_admin only)
export async function PATCH(request: NextRequest) {
    try {
        const { error, status, isSuperAdmin, user } = await checkSuperAdmin();
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Only super_admin can modify user roles' }, { status: 403 });
        }

        const body = await request.json();
        const { userId, role, full_name, phone, is_active } = body;

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent modifying own role
        if (userId === user?.id && role !== undefined) {
            return NextResponse.json({ error: 'Cannot modify your own role' }, { status: 400 });
        }

        // Validate role if provided
        if (role && !['customer', 'admin', 'super_admin'].includes(role)) {
            return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
        }

        const updateData: Record<string, any> = {};
        if (role !== undefined) updateData.role = role;
        if (full_name !== undefined) updateData.full_name = full_name;
        if (phone !== undefined) updateData.phone = phone;
        if (is_active !== undefined) updateData.is_active = is_active;

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No update data provided' }, { status: 400 });
        }

        const adminClient = getAdminClient();
        const { data, error: updateError } = await adminClient
            .from('profiles')
            .update(updateData)
            .eq('id', userId)
            .select()
            .single();

        if (updateError) {
            console.error('Error updating user:', updateError);
            return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
        }

        return NextResponse.json({ user: data, message: 'User updated successfully' });
    } catch (error) {
        console.error('PATCH user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// DELETE - Delete user (super_admin only)
export async function DELETE(request: NextRequest) {
    try {
        const { error, status, isSuperAdmin, user } = await checkSuperAdmin();
        if (error) {
            return NextResponse.json({ error }, { status });
        }

        if (!isSuperAdmin) {
            return NextResponse.json({ error: 'Only super_admin can delete users' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
        }

        // Prevent self-deletion
        if (userId === user?.id) {
            return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 });
        }

        const adminClient = getAdminClient();

        // Check if user has orders
        const { data: orders } = await adminClient
            .from('orders')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (orders && orders.length > 0) {
            return NextResponse.json({
                error: 'Cannot delete user with existing orders. Consider deactivating instead.'
            }, { status: 400 });
        }

        // Delete from auth.users (this will cascade to profiles due to trigger)
        const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

        if (deleteError) {
            console.error('Error deleting user:', deleteError);
            return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('DELETE user error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
