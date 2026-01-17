import webPush from 'web-push';
import { createAdminClient } from '@/lib/supabase/admin';

// VAPID keys should be generated once and stored in environment variables
// Generate with: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:support@simplysolutions.co.in';

// Configure web-push
if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
    title: string;
    body: string;
    type: 'order_update' | 'ticket_reply' | 'price_alert' | 'promotion' | 'system';
    data?: Record<string, any>;
    tag?: string;
    actions?: Array<{ action: string; title: string }>;
}

// Send push notification to a specific user
export async function sendPushToUser(userId: string, payload: PushPayload): Promise<boolean> {
    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        console.warn('VAPID keys not configured, skipping push notification');
        return false;
    }

    const adminClient = createAdminClient();

    try {
        // Get user's active subscriptions
        const { data: subscriptions, error } = await adminClient
            .from('push_subscriptions')
            .select('*')
            .eq('user_id', userId)
            .eq('is_active', true);

        if (error || !subscriptions || subscriptions.length === 0) {
            return false;
        }

        // Send to all subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(sub => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: sub.keys as { p256dh: string; auth: string },
                };

                return webPush.sendNotification(
                    pushSubscription,
                    JSON.stringify(payload)
                );
            })
        );

        // Deactivate failed subscriptions (e.g., expired)
        const failedEndpoints = results
            .map((result, index) => {
                if (result.status === 'rejected' && result.reason?.statusCode === 410) {
                    return subscriptions[index].endpoint;
                }
                return null;
            })
            .filter(Boolean);

        if (failedEndpoints.length > 0) {
            await adminClient
                .from('push_subscriptions')
                .update({ is_active: false })
                .in('endpoint', failedEndpoints as string[]);
        }

        // Log notification
        await adminClient
            .from('notifications')
            .insert({
                user_id: userId,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                data: payload.data || {},
            });

        return results.some(r => r.status === 'fulfilled');
    } catch (error) {
        console.error('Push notification error:', error);
        return false;
    }
}

// Send push notification to multiple users
export async function sendPushToUsers(userIds: string[], payload: PushPayload): Promise<void> {
    await Promise.allSettled(userIds.map(userId => sendPushToUser(userId, payload)));
}

// Broadcast push notification to all subscribed users
export async function broadcastPush(payload: PushPayload): Promise<void> {
    const adminClient = createAdminClient();

    try {
        const { data: subscriptions, error } = await adminClient
            .from('push_subscriptions')
            .select('user_id')
            .eq('is_active', true);

        if (error || !subscriptions) return;

        const uniqueUserIds = [...new Set(subscriptions.map(s => s.user_id))];
        await sendPushToUsers(uniqueUserIds, payload);
    } catch (error) {
        console.error('Broadcast push error:', error);
    }
}

// Get VAPID public key for client
export function getPublicVapidKey(): string {
    return VAPID_PUBLIC_KEY;
}

// Helper functions for common notification types
export async function notifyOrderUpdate(userId: string, orderNumber: string, status: string, orderId: string) {
    return sendPushToUser(userId, {
        title: `Order ${orderNumber} Updated`,
        body: `Your order status is now: ${status}`,
        type: 'order_update',
        data: { orderId, type: 'order_update' },
        tag: `order-${orderId}`,
    });
}

export async function notifyTicketReply(userId: string, ticketNumber: string, ticketId: string) {
    return sendPushToUser(userId, {
        title: 'New Reply on Your Ticket',
        body: `Support has replied to ${ticketNumber}`,
        type: 'ticket_reply',
        data: { ticketId, type: 'ticket_reply' },
        tag: `ticket-${ticketId}`,
    });
}

export async function notifyPriceAlert(userId: string, productName: string, newPrice: number, productSlug: string) {
    return sendPushToUser(userId, {
        title: 'Price Drop Alert! 🎉',
        body: `${productName} is now ₹${newPrice}`,
        type: 'price_alert',
        data: { productSlug, type: 'price_alert' },
    });
}

export async function notifyPromotion(title: string, body: string, url?: string) {
    return broadcastPush({
        title,
        body,
        type: 'promotion',
        data: { url, type: 'promotion' },
    });
}
