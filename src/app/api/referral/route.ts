import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';

// GET /api/referral - Get user's referral info
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        // Get user's profile with referral code
        const { data: profile } = await supabase
            .from('profiles')
            .select('referral_code, wallet_balance')
            .eq('id', user.id)
            .single();

        // Get referral stats
        const { data: referrals, count } = await supabase
            .from('referrals')
            .select('*, referred:profiles!referred_id(full_name, email)', { count: 'exact' })
            .eq('referrer_id', user.id)
            .order('created_at', { ascending: false });

        // Calculate totals
        const totalEarnings = (referrals || []).reduce(
            (sum: number, r: any) => sum + (r.referrer_reward || 0), 0
        );

        const pendingReferrals = (referrals || []).filter(
            (r: any) => r.reward_status === 'pending'
        ).length;

        const completedReferrals = (referrals || []).filter(
            (r: any) => r.reward_status === 'credited'
        ).length;

        return successResponse({
            referralCode: profile?.referral_code,
            referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/register?ref=${profile?.referral_code}`,
            walletBalance: profile?.wallet_balance || 0,
            stats: {
                totalReferrals: count || 0,
                pendingReferrals,
                completedReferrals,
                totalEarnings,
            },
            referrals: referrals || [],
        });
    } catch (error) {
        console.error('Referral API error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/referral - Apply referral code during signup
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        const body = await request.json();
        const { referralCode } = body;

        if (!referralCode) {
            return errorResponse('Referral code is required', 400);
        }

        // Check if user already has a referrer
        const { data: currentProfile } = await supabase
            .from('profiles')
            .select('referred_by')
            .eq('id', user.id)
            .single();

        if (currentProfile?.referred_by) {
            return errorResponse('You have already used a referral code', 400);
        }

        // Find referrer
        const { data: referrer } = await supabase
            .from('profiles')
            .select('id, referral_code')
            .eq('referral_code', referralCode.toUpperCase())
            .single();

        if (!referrer) {
            return errorResponse('Invalid referral code', 400);
        }

        if (referrer.id === user.id) {
            return errorResponse('You cannot use your own referral code', 400);
        }

        const adminClient = getAdminClient();

        // Update user's profile
        await adminClient
            .from('profiles')
            .update({ referred_by: referrer.id })
            .eq('id', user.id);

        // Create referral record (rewards will be credited after first purchase)
        await adminClient
            .from('referrals')
            .insert({
                referrer_id: referrer.id,
                referred_id: user.id,
                referral_code: referralCode.toUpperCase(),
                referrer_reward: 50, // ₹50 reward for referrer
                referred_reward: 25, // ₹25 reward for referred user
                reward_status: 'pending',
            });

        return successResponse({
            message: 'Referral code applied successfully!',
            reward: 25, // Welcome bonus for referred user
        });
    } catch (error) {
        console.error('Apply referral error:', error);
        return errorResponse('Internal server error', 500);
    }
}
