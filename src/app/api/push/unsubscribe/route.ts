import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

// POST /api/push/unsubscribe - Remove push subscription
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        const { endpoint } = await request.json();

        if (!endpoint) {
            return NextResponse.json({ success: false, error: 'Endpoint required' }, { status: 400 });
        }

        const adminClient = createAdminClient();

        // Deactivate subscription
        const { error } = await adminClient
            .from('push_subscriptions')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('endpoint', endpoint);

        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push unsubscribe error:', error);
        return NextResponse.json({ success: false, error: 'Failed to unsubscribe' }, { status: 500 });
    }
}
