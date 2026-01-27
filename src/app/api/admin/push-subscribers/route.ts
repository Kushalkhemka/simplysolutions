import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check admin role
        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
        }

        const adminClient = getAdminClient();

        // Get all subscriptions with user info
        const { data: subscriptions, error } = await adminClient
            .from('push_subscriptions')
            .select(`
                id,
                user_id,
                endpoint,
                is_admin_subscriber,
                is_customer,
                order_id,
                notify_replacement_status,
                notify_product_request_status,
                notify_warranty_status,
                created_at
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching subscriptions:', error);
            return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        // Get user emails for subscriptions with user_id
        const userIds = subscriptions?.filter(s => s.user_id).map(s => s.user_id) || [];
        let userEmails: Record<string, string> = {};

        if (userIds.length > 0) {
            const { data: profiles } = await adminClient
                .from('profiles')
                .select('id, email')
                .in('id', userIds);

            if (profiles) {
                userEmails = profiles.reduce((acc, p) => {
                    acc[p.id] = p.email;
                    return acc;
                }, {} as Record<string, string>);
            }
        }

        // Enrich subscriptions with email
        const enrichedSubscriptions = subscriptions?.map(sub => ({
            ...sub,
            user_email: sub.user_id ? userEmails[sub.user_id] : null,
            device_id: sub.endpoint?.split('/').pop()?.slice(-8) || 'Unknown',
        }));

        // Get stats
        const stats = {
            total: subscriptions?.length || 0,
            admins: subscriptions?.filter(s => s.is_admin_subscriber).length || 0,
            customers: subscriptions?.filter(s => s.is_customer).length || 0,
        };

        return NextResponse.json({
            success: true,
            subscriptions: enrichedSubscriptions,
            stats,
        });
    } catch (error) {
        console.error('Push subscribers error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
