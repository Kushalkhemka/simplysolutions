import { createAdminClient } from '@/lib/supabase/admin';
import { sendPushToUser } from './index';

// FSN inventory thresholds - alert when below these values
export const INVENTORY_THRESHOLDS: Record<string, number> = {
    'WINDOWS11': 5,
    'OPSG3TNK9HZDZEM9': 5,
    'OFFG9MREFCXD658G': 5,
    'OFFICE2024-WIN': 5,
    'WIN11HOME': 3,
    'OPSG4ZTTK5MMZWPB_ALI': 3,
    'PP2016': 3,
};

// Cache for last alert times to prevent spam (1 hour cooldown)
const alertCooldownCache = new Map<string, number>();

// Send push notification to all admin subscribers
export async function sendPushToAdmins(payload: {
    title: string;
    body: string;
    type: string;
    data?: Record<string, unknown>;
    tag?: string;
}): Promise<void> {
    const adminClient = createAdminClient();

    try {
        // Get all admin subscribers
        const { data: subscriptions, error } = await adminClient
            .from('push_subscriptions')
            .select('user_id')
            .eq('is_active', true)
            .eq('is_admin_subscriber', true);

        if (error || !subscriptions || subscriptions.length === 0) {
            console.log('No admin subscribers found');
            return;
        }

        // Get unique user IDs
        const uniqueUserIds = [...new Set(subscriptions.map(s => s.user_id))];

        // Send to all admin subscribers
        await Promise.allSettled(
            uniqueUserIds.map(userId =>
                sendPushToUser(userId, {
                    title: payload.title,
                    body: payload.body,
                    type: 'system',
                    data: { ...payload.data, type: payload.type },
                    tag: payload.tag,
                })
            )
        );

        console.log(`Sent admin notification to ${uniqueUserIds.length} admins`);
    } catch (error) {
        console.error('Error sending admin notifications:', error);
    }
}

// Notify admins of new replacement request
export async function notifyAdminReplacementRequest(
    orderId: string,
    customerEmail: string,
    fsn: string
): Promise<void> {
    await sendPushToAdmins({
        title: '🔄 New Replacement Request',
        body: `Order ${orderId} - ${customerEmail} (${fsn})`,
        type: 'admin_replacement_request',
        data: {
            orderId,
            customerEmail,
            fsn,
        },
        tag: `replacement-${orderId}`,
    });
}

// Notify admins of low inventory
export async function notifyAdminLowInventory(
    fsn: string,
    currentCount: number,
    threshold: number
): Promise<void> {
    await sendPushToAdmins({
        title: '⚠️ Low Inventory Alert',
        body: `${fsn}: Only ${currentCount} keys remaining (threshold: ${threshold})`,
        type: 'admin_low_inventory',
        data: {
            fsn,
            currentCount,
            threshold,
        },
        tag: `low-inventory-${fsn}`,
    });
}

// Check inventory and send alert if below threshold
export async function checkAndAlertLowInventory(fsn: string): Promise<void> {
    const threshold = INVENTORY_THRESHOLDS[fsn];

    // Only check FSNs we're tracking
    if (!threshold) return;

    const adminClient = createAdminClient();

    try {
        // Count available keys for this FSN
        const { count, error } = await adminClient
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('fsn', fsn)
            .eq('is_redeemed', false);

        if (error) {
            console.error('Error checking inventory:', error);
            return;
        }

        const currentCount = count || 0;

        if (currentCount < threshold) {
            // Check if we already alerted recently (within last hour)
            const cacheKey = `low-inventory-alert-${fsn}`;
            const lastAlertTime = alertCooldownCache.get(cacheKey);
            const now = Date.now();

            if (lastAlertTime && now - lastAlertTime < 60 * 60 * 1000) {
                // Already alerted within the last hour, skip
                return;
            }

            // Send alert
            await notifyAdminLowInventory(fsn, currentCount, threshold);

            // Cache the alert time
            alertCooldownCache.set(cacheKey, now);
        }
    } catch (error) {
        console.error('Error in checkAndAlertLowInventory:', error);
    }
}

