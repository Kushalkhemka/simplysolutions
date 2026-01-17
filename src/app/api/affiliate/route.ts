import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse, unauthorizedResponse } from '@/lib/utils/api-response';
import { nanoid } from 'nanoid';

// GET /api/affiliate - Get affiliate dashboard data
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        // Get affiliate data
        const { data: affiliate } = await supabase
            .from('affiliates')
            .select('*')
            .eq('user_id', user.id)
            .single();

        if (!affiliate) {
            return successResponse({ isAffiliate: false });
        }

        // Get recent clicks
        const { data: recentClicks } = await supabase
            .from('affiliate_clicks')
            .select('*, product:products(name)')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .limit(20);

        // Get recent commissions
        const { data: recentCommissions } = await supabase
            .from('affiliate_commissions')
            .select('*, order:orders(order_number, total_amount)')
            .eq('affiliate_id', affiliate.id)
            .order('created_at', { ascending: false })
            .limit(20);

        return successResponse({
            isAffiliate: true,
            affiliate: {
                ...affiliate,
                affiliateLink: `${process.env.NEXT_PUBLIC_APP_URL}?ref=${affiliate.affiliate_code}`,
            },
            recentClicks: recentClicks || [],
            recentCommissions: recentCommissions || [],
        });
    } catch (error) {
        console.error('Affiliate API error:', error);
        return errorResponse('Internal server error', 500);
    }
}

// POST /api/affiliate - Apply to become an affiliate
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return unauthorizedResponse();
        }

        // Check if already an affiliate
        const { data: existing } = await supabase
            .from('affiliates')
            .select('id, status')
            .eq('user_id', user.id)
            .single();

        if (existing) {
            return errorResponse(`You are already ${existing.status === 'approved' ? 'an affiliate' : 'pending approval'}`, 400);
        }

        const body = await request.json();
        const { payoutEmail, payoutMethod = 'bank_transfer' } = body;

        if (!payoutEmail) {
            return errorResponse('Payout email is required', 400);
        }

        const adminClient = getAdminClient();

        // Generate unique affiliate code
        const affiliateCode = `AFF${nanoid(8).toUpperCase()}`;

        // Create affiliate record
        const { data: affiliate, error } = await adminClient
            .from('affiliates')
            .insert({
                user_id: user.id,
                affiliate_code: affiliateCode,
                payout_email: payoutEmail,
                payout_method: payoutMethod,
                status: 'pending',
                commission_rate: 10.00, // 10% default commission
            })
            .select()
            .single();

        if (error) {
            console.error('Affiliate creation error:', error);
            return errorResponse('Failed to create affiliate account', 500);
        }

        return successResponse({
            message: 'Affiliate application submitted! We will review and approve within 24-48 hours.',
            affiliate,
        });
    } catch (error) {
        console.error('Affiliate application error:', error);
        return errorResponse('Internal server error', 500);
    }
}
