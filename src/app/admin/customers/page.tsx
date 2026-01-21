import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import CustomersClient from './CustomersClient';

export default async function AdminCustomersPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        redirect('/login');
    }

    // Use admin client to bypass RLS and get all profiles
    const adminClient = getAdminClient();

    // Get current user's role
    const { data: currentProfile } = await adminClient
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (!currentProfile || (currentProfile.role !== 'admin' && currentProfile.role !== 'super_admin')) {
        redirect('/');
    }

    // Get all customers
    const { data: profiles } = await adminClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    // Get order counts per customer
    const { data: orderCounts } = await adminClient
        .from('orders')
        .select('user_id')
        .eq('status', 'delivered');

    const orderCountMap = (orderCounts || []).reduce((acc: Record<string, number>, order: any) => {
        acc[order.user_id] = (acc[order.user_id] || 0) + 1;
        return acc;
    }, {});

    const usersWithOrders = (profiles || []).map(profile => ({
        ...profile,
        order_count: orderCountMap[profile.id] || 0
    }));

    return (
        <CustomersClient
            initialUsers={usersWithOrders}
            currentUserRole={currentProfile.role}
            currentUserId={user.id}
        />
    );
}
