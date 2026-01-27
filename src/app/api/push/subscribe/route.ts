import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/push/subscribe - Save push subscription
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const subscription = await request.json();

        if (!subscription.endpoint || !subscription.keys) {
            return NextResponse.json({ success: false, error: 'Invalid subscription' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Upsert subscription
        const { error } = await adminClient
            .from('push_subscriptions')
            .upsert({
                user_id: user.id,
                endpoint: subscription.endpoint,
                keys: subscription.keys,
                is_active: true,
                is_admin_subscriber: subscription.isAdminSubscriber || false,
                user_agent: request.headers.get('user-agent') || null,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id,endpoint',
            });

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push subscribe error:', error);
        return NextResponse.json({ success: false, error: 'Failed to save subscription' }, { status: 500 });
    }
}
