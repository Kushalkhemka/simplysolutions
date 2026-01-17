import { createAdminClient } from '@/lib/supabase/admin';

export interface PointsConfig {
    purchaseRate: number; // Points per ₹100 spent
    referralBonus: number;
    reviewBonus: number;
    tierThresholds: {
        silver: number;
        gold: number;
        platinum: number;
    };
    tierMultipliers: {
        bronze: number;
        silver: number;
        gold: number;
        platinum: number;
    };
}

export const POINTS_CONFIG: PointsConfig = {
    purchaseRate: 1, // 1 point per ₹100
    referralBonus: 50, // 50 points for successful referral
    reviewBonus: 10, // 10 points for writing a review
    tierThresholds: {
        silver: 500,
        gold: 2000,
        platinum: 5000,
    },
    tierMultipliers: {
        bronze: 1,
        silver: 1.25, // 25% more points
        gold: 1.5, // 50% more points
        platinum: 2, // 100% more points
    },
};

// Calculate points for a purchase
export function calculatePurchasePoints(amount: number, tier: string): number {
    const basePoints = Math.floor(amount / 100) * POINTS_CONFIG.purchaseRate;
    const multiplier = POINTS_CONFIG.tierMultipliers[tier as keyof typeof POINTS_CONFIG.tierMultipliers] || 1;
    return Math.floor(basePoints * multiplier);
}

// Get tier based on lifetime points
export function getTierFromPoints(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
    if (lifetimePoints >= POINTS_CONFIG.tierThresholds.platinum) return 'platinum';
    if (lifetimePoints >= POINTS_CONFIG.tierThresholds.gold) return 'gold';
    if (lifetimePoints >= POINTS_CONFIG.tierThresholds.silver) return 'silver';
    return 'bronze';
}

// Get tier discount percentage
export function getTierDiscount(tier: string): number {
    switch (tier) {
        case 'platinum': return 15;
        case 'gold': return 10;
        case 'silver': return 5;
        default: return 0;
    }
}

// Award points to user
export async function awardPoints(
    userId: string,
    points: number,
    type: 'purchase' | 'review' | 'referral' | 'bonus',
    description: string,
    orderId?: string
): Promise<boolean> {
    const adminClient = createAdminClient();

    try {
        // Get current user points
        const { data: profile } = await adminClient
            .from('profiles')
            .select('points, lifetime_points, tier')
            .eq('id', userId)
            .single();

        if (!profile) return false;

        const newPoints = (profile.points || 0) + points;
        const newLifetimePoints = (profile.lifetime_points || 0) + points;
        const newTier = getTierFromPoints(newLifetimePoints);

        // Update user points
        const { error: updateError } = await adminClient
            .from('profiles')
            .update({
                points: newPoints,
                lifetime_points: newLifetimePoints,
                tier: newTier,
            })
            .eq('id', userId);

        if (updateError) {
            console.error('Error updating points:', updateError);
            return false;
        }

        // Record transaction
        const { error: transactionError } = await adminClient
            .from('point_transactions')
            .insert({
                user_id: userId,
                points: points,
                type: type,
                description: description,
                order_id: orderId || null,
            });

        if (transactionError) {
            console.error('Error recording transaction:', transactionError);
            // Don't fail the whole operation
        }

        return true;
    } catch (error) {
        console.error('Award points error:', error);
        return false;
    }
}

// Redeem points
export async function redeemPoints(
    userId: string,
    points: number,
    description: string
): Promise<{ success: boolean; error?: string }> {
    const adminClient = createAdminClient();

    try {
        // Get current user points
        const { data: profile } = await adminClient
            .from('profiles')
            .select('points')
            .eq('id', userId)
            .single();

        if (!profile) {
            return { success: false, error: 'User not found' };
        }

        if ((profile.points || 0) < points) {
            return { success: false, error: 'Insufficient points' };
        }

        // Deduct points
        const { error: updateError } = await adminClient
            .from('profiles')
            .update({
                points: profile.points - points,
            })
            .eq('id', userId);

        if (updateError) {
            return { success: false, error: 'Failed to redeem points' };
        }

        // Record transaction
        await adminClient
            .from('point_transactions')
            .insert({
                user_id: userId,
                points: -points,
                type: 'redemption',
                description: description,
            });

        return { success: true };
    } catch (error) {
        console.error('Redeem points error:', error);
        return { success: false, error: 'An error occurred' };
    }
}

// Get points history for user
export async function getPointsHistory(userId: string, limit: number = 20): Promise<any[]> {
    const adminClient = createAdminClient();

    const { data: transactions, error } = await adminClient
        .from('point_transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

    if (error) {
        console.error('Error fetching points history:', error);
        return [];
    }

    return transactions || [];
}

// Convert points to rupees (for discount)
export function pointsToRupees(points: number): number {
    return points; // 1 point = ₹1
}

// Convert rupees to points
export function rupeesToPoints(rupees: number): number {
    return rupees; // ₹1 = 1 point
}
