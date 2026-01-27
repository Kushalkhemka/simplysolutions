/**
 * Customer Push Notification Helpers
 * 
 * These functions send push notifications to customers when their requests are approved/updated.
 * They work without requiring user login by matching device subscriptions to order IDs.
 */

import webpush from 'web-push';
import { getAdminClient } from '@/lib/supabase/admin';

// Configure web-push
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY!;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@simplysolutions.co.in';

if (vapidPublicKey && vapidPrivateKey) {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
}

interface CustomerNotificationPayload {
    title: string;
    body: string;
    icon?: string;
    url?: string;
    tag?: string;
}

/**
 * Send push notification to customer by order ID
 */
export async function sendCustomerNotification(orderId: string, payload: CustomerNotificationPayload) {
    if (!vapidPublicKey || !vapidPrivateKey) {
        console.warn('VAPID keys not configured, skipping customer push notification');
        return;
    }

    try {
        const adminClient = getAdminClient();

        // Find subscriptions linked to this order
        const { data: subscriptions, error } = await adminClient
            .from('push_subscriptions')
            .select('*')
            .eq('order_id', orderId)
            .eq('is_customer', true);

        if (error || !subscriptions?.length) {
            console.log(`No customer subscriptions found for order ${orderId}`);
            return;
        }

        const pushPayload = {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || '/icon.png',
            badge: '/icon.png',
            data: {
                url: payload.url || '/',
                type: 'customer_notification',
            },
            tag: payload.tag || `order-${orderId}`,
        };

        // Send to all matching subscriptions
        const results = await Promise.allSettled(
            subscriptions.map(async (sub) => {
                const pushSubscription = {
                    endpoint: sub.endpoint,
                    keys: {
                        p256dh: sub.p256dh,
                        auth: sub.auth,
                    },
                };

                try {
                    await webpush.sendNotification(pushSubscription, JSON.stringify(pushPayload));
                } catch (error: any) {
                    // Remove stale subscription if it's gone
                    if (error.statusCode === 404 || error.statusCode === 410) {
                        await adminClient.from('push_subscriptions').delete().eq('id', sub.id);
                    }
                    throw error;
                }
            })
        );

        const successful = results.filter(r => r.status === 'fulfilled').length;
        console.log(`Sent customer notification to ${successful}/${subscriptions.length} devices for order ${orderId}`);
    } catch (error) {
        console.error('Error sending customer notification:', error);
    }
}

/**
 * Notify customer when replacement request is approved/rejected
 */
export async function notifyReplacementRequestStatus(
    orderId: string,
    status: 'approved' | 'rejected',
    productName?: string
) {
    const title = status === 'approved' ? '✅ Replacement Approved!' : '❌ Replacement Update';
    const body = status === 'approved'
        ? `Your replacement for ${productName || 'your order'} has been approved. Check your email for the new activation key.`
        : `Your replacement request for ${productName || 'your order'} requires attention. Please check your email.`;

    await sendCustomerNotification(orderId, {
        title,
        body,
        url: '/dashboard/orders',
        tag: `replacement-${orderId}`,
    });
}

/**
 * Notify customer when product request is approved
 */
export async function notifyProductRequestStatus(
    orderId: string,
    status: 'approved' | 'rejected' | 'fulfilled',
    productName?: string
) {
    let title: string;
    let body: string;

    switch (status) {
        case 'approved':
            title = '✅ Request Approved!';
            body = `Your request for ${productName || 'your product'} has been approved.`;
            break;
        case 'fulfilled':
            title = '🎉 Order Fulfilled!';
            body = `Your ${productName || 'product'} is ready! Check your email for details.`;
            break;
        case 'rejected':
            title = '❌ Request Update';
            body = `Your request for ${productName || 'your product'} requires attention.`;
            break;
    }

    await sendCustomerNotification(orderId, {
        title,
        body,
        url: '/dashboard/orders',
        tag: `product-request-${orderId}`,
    });
}

/**
 * Notify customer when warranty is approved
 */
export async function notifyWarrantyStatus(
    orderId: string,
    status: 'approved' | 'rejected',
    productName?: string
) {
    const title = status === 'approved' ? '✅ Warranty Registered!' : '❌ Warranty Update';
    const body = status === 'approved'
        ? `Your warranty for ${productName || 'your product'} has been registered successfully.`
        : `Your warranty registration for ${productName || 'your product'} requires attention.`;

    await sendCustomerNotification(orderId, {
        title,
        body,
        url: '/dashboard/warranty',
        tag: `warranty-${orderId}`,
    });
}
