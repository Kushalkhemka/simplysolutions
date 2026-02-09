/**
 * FBA Redemption Check Utility
 * 
 * Checks if an FBA order can be redeemed based on:
 * 1. State-based delivery delay (from order_date)
 * 2. Early appeal approval status
 * 
 * NOTE: This only applies to FBA (AFN) orders. MFN orders are not affected.
 */

import { createClient } from '@supabase/supabase-js';

// Default delay in hours if state not found in database (4 days = 96 hours)
const DEFAULT_DELAY_HOURS = 96;

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
            .select('state_name, delay_hours');

        if (error) {
            console.error('Error fetching state delays:', error);
            return new Map();
        }

        const delaysMap = new Map<string, number>();
        (data || []).forEach((row: { state_name: string; delay_hours: number }) => {
            // Store state name -> delay in hours
            delaysMap.set(row.state_name.toUpperCase(), row.delay_hours);
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
 * Get delivery delay in hours for a given state
 */
export async function getDeliveryDelayHours(state: string | null): Promise<number> {
    const stateDelays = await getStateDelaysFromDB();

    // First try to get delay for the specific state
    if (state) {
        const normalizedState = state.toUpperCase().trim();
        if (stateDelays.has(normalizedState)) {
            return stateDelays.get(normalizedState)!;
        }
    }

    // Fall back to DEFAULT entry in database, then hardcoded default
    if (stateDelays.has('DEFAULT')) {
        return stateDelays.get('DEFAULT')!;
    }

    return DEFAULT_DELAY_HOURS;
}

/**
 * Synchronous version using cached data (for non-async contexts)
 * Falls back to default if cache not available
 */
export function getDeliveryDelayHoursSync(state: string | null): number {
    if (!stateDelaysCache) {
        return DEFAULT_DELAY_HOURS;
    }

    if (state) {
        const normalizedState = state.toUpperCase().trim();
        if (stateDelaysCache.has(normalizedState)) {
            return stateDelaysCache.get(normalizedState)!;
        }
    }

    // Check for DEFAULT in cache
    if (stateDelaysCache.has('DEFAULT')) {
        return stateDelaysCache.get('DEFAULT')!;
    }

    return DEFAULT_DELAY_HOURS;
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
    order_date?: string | null;
    created_at?: string | null;
    state?: string | null;
    early_appeal_status?: string | null;
    is_refunded?: boolean | null;
    shipment_status?: string | null;  // Admin-controlled: PENDING, SHIPPED, DELIVERED
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

    // If admin has marked as DELIVERED, bypass time-based lock
    if (order.shipment_status === 'DELIVERED') {
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

    // Calculate redeemable date based on order_date + state delay (in hours)
    const orderDate = order.order_date || order.created_at;
    if (!orderDate) {
        // If no date available, allow redemption (shouldn't happen in practice)
        return { canRedeem: true };
    }

    // Get delay hours for this state
    const delayHours = await getDeliveryDelayHours(order.state ?? null);

    // Calculate when the order becomes redeemable (order_date + state delay in hours)
    const orderCreatedAt = new Date(orderDate);
    const redeemableAt = new Date(orderCreatedAt);
    redeemableAt.setTime(redeemableAt.getTime() + (delayHours * 60 * 60 * 1000));

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
            reason = 'Your order is still on the way. Our system has detected that your order has not been delivered yet. If you have already received your package, you can submit proof of delivery to activate early.';
        } else {
            reason = 'Your order is still on the way. Our system has detected that your order has not been delivered yet. If you have already received your package, you can submit proof of delivery to activate early.\n\nThis security measure helps protect your purchase from unauthorized access.';
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
 * Calculate the redeemable date based on order date and state
 * Exported for admin/display purposes
 */
export async function calculateRedeemableAt(orderDate: Date, state: string | null): Promise<Date> {
    const delayHours = await getDeliveryDelayHours(state);
    const redeemableAt = new Date(orderDate);
    redeemableAt.setTime(redeemableAt.getTime() + (delayHours * 60 * 60 * 1000));
    return redeemableAt;
}

/**
 * Invalidate the state delays cache (call when admin updates settings)
 */
export function invalidateStateDelaysCache(): void {
    stateDelaysCache = null;
    cacheExpiry = 0;
}
