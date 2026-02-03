/**
 * FBA Redemption Check Utility
 * 
 * Checks if an FBA order can be redeemed based on:
 * 1. State-based delivery delay (from synced_at date)
 * 2. Early appeal approval status
 * 
 * NOTE: This only applies to FBA (AFN) orders. MFN orders are not affected.
 */

import { createClient } from '@supabase/supabase-js';

// Default delay if state not found in database
const DEFAULT_DELAY_DAYS = 4;

// Cache for state delays to avoid repeated DB calls
let stateDelaysCache: Map<string, number> | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch state delays from database with caching
 */
async function getStateDelaysFromDB(): Promise<Map<string, number>> {
    const now = Date.now();

    // Return cached data if still valid
    if (stateDelaysCache && now < cacheExpiry) {
        return stateDelaysCache;
    }

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('fba_state_delays')
            .select('state_name, delay_days');

        if (error) {
            console.error('Error fetching state delays:', error);
            return new Map();
        }

        const delaysMap = new Map<string, number>();
        (data || []).forEach((row: { state_name: string; delay_days: number }) => {
            // Store both original and uppercase for flexible matching
            delaysMap.set(row.state_name.toUpperCase(), row.delay_days);
        });

        // Update cache
        stateDelaysCache = delaysMap;
        cacheExpiry = now + CACHE_TTL;

        return delaysMap;
    } catch (error) {
        console.error('Error in getStateDelaysFromDB:', error);
        return new Map();
    }
}

/**
 * Get delivery delay in days for a given state
 */
export async function getDeliveryDelayDays(state: string | null): Promise<number> {
    if (!state) return DEFAULT_DELAY_DAYS;

    const stateDelays = await getStateDelaysFromDB();
    const normalizedState = state.toUpperCase().trim();

    if (stateDelays.has(normalizedState)) {
        return stateDelays.get(normalizedState)!;
    }

    return DEFAULT_DELAY_DAYS;
}

/**
 * Synchronous version using cached data (for non-async contexts)
 * Falls back to default if cache not available
 */
export function getDeliveryDelayDaysSync(state: string | null): number {
    if (!state) return DEFAULT_DELAY_DAYS;

    if (!stateDelaysCache) {
        return DEFAULT_DELAY_DAYS;
    }

    const normalizedState = state.toUpperCase().trim();
    return stateDelaysCache.get(normalizedState) || DEFAULT_DELAY_DAYS;
}

export interface RedemptionCheckResult {
    canRedeem: boolean;
    reason?: string;
    redeemableAt?: Date;
    daysRemaining?: number;
    canAppeal?: boolean;
    appealStatus?: string;
}

export interface OrderForRedemptionCheck {
    fulfillment_type?: string | null;
    fulfillment_status?: string | null;
    synced_at?: string | null;
    created_at?: string | null;
    redeemable_at?: string | null;
    state?: string | null;
    early_appeal_status?: string | null;
    is_refunded?: boolean | null;
}

/**
 * Check if an FBA order can be redeemed
 */
export async function checkFBARedemption(order: OrderForRedemptionCheck): Promise<RedemptionCheckResult> {
    // Only apply restrictions to FBA orders
    if (order.fulfillment_type !== 'amazon_fba') {
        return { canRedeem: true };
    }

    // If early appeal is approved, allow redemption immediately
    if (order.early_appeal_status === 'APPROVED') {
        return { canRedeem: true };
    }

    // Check if order is cancelled
    if (order.fulfillment_status === 'Canceled' || order.fulfillment_status === 'Cancelled') {
        return {
            canRedeem: false,
            reason: 'This order has been cancelled. Please contact Amazon support for assistance.',
            canAppeal: false
        };
    }

    // Check if order has been refunded
    if (order.is_refunded) {
        return {
            canRedeem: false,
            reason: 'This order has been refunded. Activation is not available for refunded orders.',
            canAppeal: false
        };
    }

    // Check if order is still pending (not shipped yet)
    // Even if delay period passes, we can't allow redemption until order ships
    if (order.fulfillment_status === 'Pending' || order.fulfillment_status === 'Unshipped') {
        return {
            canRedeem: false,
            reason: 'Your order is being prepared for shipment. You will be able to activate your product once it has been shipped and the delivery period has passed.',
            canAppeal: false
        };
    }

    // Calculate redeemable date based on synced_at + state delay
    const orderDate = order.synced_at || order.created_at;
    if (!orderDate) {
        // If no date available, allow redemption (shouldn't happen in practice)
        return { canRedeem: true };
    }

    // Get delay days for this state
    const delayDays = await getDeliveryDelayDays(order.state ?? null);

    // Calculate when the order becomes redeemable
    const orderCreatedAt = new Date(orderDate);
    const redeemableAt = new Date(orderCreatedAt);
    redeemableAt.setDate(redeemableAt.getDate() + delayDays);

    const now = new Date();

    if (now < redeemableAt) {
        const diffMs = redeemableAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const hoursRemaining = Math.ceil(diffMs / (1000 * 60 * 60));

        // Determine if there's a pending appeal
        const hasPendingAppeal = order.early_appeal_status === 'PENDING';

        let reason: string;
        if (hasPendingAppeal) {
            reason = 'Your early delivery appeal is being reviewed by our team. We will notify you once it is processed.';
        } else if (hoursRemaining <= 24) {
            reason = `Your order is being delivered. You can activate your product in approximately ${hoursRemaining} hour(s). If you have already received your package, you can submit proof of delivery to activate early.`;
        } else {
            reason = `Your order is on the way! Estimated delivery: ${daysRemaining} day(s). If you have already received your package, you can submit proof of delivery to activate early.\n\nThis security measure helps protect your purchase from unauthorized access.`;
        }

        return {
            canRedeem: false,
            reason,
            redeemableAt,
            daysRemaining,
            canAppeal: !hasPendingAppeal && order.early_appeal_status !== 'REJECTED',
            appealStatus: order.early_appeal_status || undefined
        };
    }

    return { canRedeem: true };
}


/**
 * Calculate the redeemable date based on synced date and state
 * Exported for admin/display purposes
 */
export async function calculateRedeemableAt(syncedAt: Date, state: string | null): Promise<Date> {
    const delayDays = await getDeliveryDelayDays(state);
    const redeemableAt = new Date(syncedAt);
    redeemableAt.setDate(redeemableAt.getDate() + delayDays);
    return redeemableAt;
}

/**
 * Invalidate the state delays cache (call when admin updates settings)
 */
export function invalidateStateDelaysCache(): void {
    stateDelaysCache = null;
    cacheExpiry = 0;
}
