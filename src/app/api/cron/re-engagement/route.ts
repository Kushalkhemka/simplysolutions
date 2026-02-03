import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendReEngagementEmail } from '@/lib/email';

// This endpoint should be called by an external cron service
// Run weekly (every Monday at 10:00 AM IST)

// Re-engagement coupon codes by tier based on inactivity
const RE_ENGAGEMENT_OFFERS = [
    { minDays: 30, maxDays: 60, discountPercent: 10, couponPrefix: 'COMEBACK10' },
    { minDays: 60, maxDays: 90, discountPercent: 15, couponPrefix: 'MISSYOU15' },
    { minDays: 90, maxDays: Infinity, discountPercent: 20, couponPrefix: 'WEBACK20' },
];

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminClient = getAdminClient();

        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get all REGISTERED users who are inactive:
        // - Never logged in (last_login_at is null)
        // - OR last login was 30+ days ago
        const { data: inactiveUsers, error } = await adminClient
            .from('profiles')
            .select('id, email, full_name, last_login_at, created_at')
            .or(`last_login_at.is.null,last_login_at.lt.${thirtyDaysAgo.toISOString()}`)
            .not('email', 'is', null);

        if (error) {
            console.error('Error fetching inactive users:', error);
            return NextResponse.json({ error: 'Database error', details: error.message }, { status: 500 });
        }

        if (!inactiveUsers || inactiveUsers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No inactive users eligible for re-engagement',
                sent: 0,
            });
        }

        // Filter out marketplace emails (if any got through registration)
        const eligibleUsers = inactiveUsers.filter(user =>
            user.email && !user.email.includes('@marketplace.amazon')
        );

        // Check which users received re-engagement email in last 30 days
        const { data: recentEmails } = await adminClient
            .from('re_engagement_emails')
            .select('customer_email')
            .gte('sent_at', thirtyDaysAgo.toISOString());

        const recentlyEmailed = new Set(recentEmails?.map(e => e.customer_email) || []);

        let sentCount = 0;
        const errors: string[] = [];
        const maxEmails = 50; // Limit per run to avoid rate limits

        for (const user of eligibleUsers) {
            if (sentCount >= maxEmails) break;
            if (!user.email) continue;
            if (recentlyEmailed.has(user.email)) continue; // Already emailed recently

            // Calculate days of inactivity
            // If never logged in, use account creation date
            const lastActiveDate = user.last_login_at
                ? new Date(user.last_login_at)
                : new Date(user.created_at);

            const daysSinceActivity = Math.floor(
                (now.getTime() - lastActiveDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Find appropriate offer tier
            const offer = RE_ENGAGEMENT_OFFERS.find(
                o => daysSinceActivity >= o.minDays && daysSinceActivity < o.maxDays
            );

            if (!offer) continue;

            try {
                const result = await sendReEngagementEmail({
                    to: user.email,
                    customerName: user.full_name || user.email.split('@')[0],
                    lastOrderDate: lastActiveDate.toISOString(), // Using as "last activity date"
                    daysSinceOrder: daysSinceActivity, // Actually "days since last login"
                    couponCode: offer.couponPrefix,
                    discountPercent: offer.discountPercent,
                });

                if (result.success) {
                    // Track sent email
                    await adminClient
                        .from('re_engagement_emails')
                        .insert({
                            customer_email: user.email,
                            sent_at: new Date().toISOString(),
                            offer_code: offer.couponPrefix,
                            days_since_order: daysSinceActivity, // Actually days since login
                        });

                    sentCount++;
                } else {
                    errors.push(`${user.email}: ${JSON.stringify(result.error)}`);
                }
            } catch (err) {
                errors.push(`${user.email}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} re-engagement emails to inactive registered users`,
            sent: sentCount,
            eligible: eligibleUsers.length - recentlyEmailed.size,
            totalInactive: eligibleUsers.length,
            neverLoggedIn: eligibleUsers.filter(u => !u.last_login_at).length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Re-engagement cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
