import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { subscription, orderId, requestType } = body;

        if (!subscription?.endpoint || !subscription?.keys) {
            return NextResponse.json({ error: 'Invalid subscription data' }, { status: 400 });
        }

        const supabase = await createClient();
        const adminClient = getAdminClient();

        // Try to get user if logged in (but don't require it)
        let userId: string | null = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            userId = user?.id || null;
        } catch {
            // User not logged in - that's OK for customer subscriptions
        }

        // Create a unique identifier for this subscription (hash of endpoint)
        const endpointHash = subscription.endpoint.split('/').pop() || subscription.endpoint;

        // Upsert the subscription
        const { error } = await adminClient
            .from('push_subscriptions')
            .upsert({
                user_id: userId,
                endpoint: subscription.endpoint,
                p256dh: subscription.keys.p256dh,
                auth: subscription.keys.auth,
                is_customer: true,
                order_id: orderId || null,
                notify_replacement_status: requestType === 'replacement',
                notify_product_request_status: requestType === 'product_request',
                notify_warranty_status: requestType === 'warranty',
            }, {
                onConflict: 'endpoint',
            });

        if (error) {
            console.error('Error saving customer subscription:', error);
            return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Customer subscribe error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
