import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendReEngagementEmail } from '@/lib/email';

// This endpoint should be called by an external cron service
// Run weekly (every Monday at 10:00 AM IST)

// Re-engagement coupon codes by tier
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

        // Find customers who ordered 30+ days ago and haven't received re-engagement email recently
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        // Get all unique customer emails with their last order date
        const { data: customers, error } = await adminClient
            .from('amazon_orders')
            .select('customer_email, customer_name, created_at')
            .not('customer_email', 'is', null)
            .lt('created_at', thirtyDaysAgo.toISOString())
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching customers:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!customers || customers.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No customers eligible for re-engagement',
                sent: 0,
            });
        }

        // Group by email and get most recent order per customer
        const customerMap = new Map<string, { email: string; name: string; lastOrderDate: Date }>();

        for (const order of customers) {
            if (!order.customer_email) continue;

            const existing = customerMap.get(order.customer_email);
            const orderDate = new Date(order.created_at);

            if (!existing || orderDate > existing.lastOrderDate) {
                customerMap.set(order.customer_email, {
                    email: order.customer_email,
                    name: order.customer_name || order.customer_email.split('@')[0],
                    lastOrderDate: orderDate,
                });
            }
        }

        // Check which customers have recent orders (exclude them)
        const { data: recentOrders } = await adminClient
            .from('amazon_orders')
            .select('customer_email')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .not('customer_email', 'is', null);

        const recentCustomers = new Set(recentOrders?.map(o => o.customer_email) || []);

        // Check which customers received re-engagement email in last 30 days
        const { data: recentEmails } = await adminClient
            .from('re_engagement_emails')
            .select('customer_email')
            .gte('sent_at', thirtyDaysAgo.toISOString());

        const recentlyEmailed = new Set(recentEmails?.map(e => e.customer_email) || []);

        let sentCount = 0;
        const errors: string[] = [];
        const maxEmails = 50; // Limit per run to avoid rate limits

        for (const [email, customer] of customerMap) {
            if (sentCount >= maxEmails) break;
            if (recentCustomers.has(email)) continue; // Has recent order
            if (recentlyEmailed.has(email)) continue; // Already emailed recently

            const daysSinceOrder = Math.floor(
                (Date.now() - customer.lastOrderDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            // Find appropriate offer tier
            const offer = RE_ENGAGEMENT_OFFERS.find(
                o => daysSinceOrder >= o.minDays && daysSinceOrder < o.maxDays
            );

            if (!offer) continue;

            try {
                const result = await sendReEngagementEmail({
                    to: email,
                    customerName: customer.name,
                    lastOrderDate: customer.lastOrderDate.toISOString(),
                    daysSinceOrder,
                    couponCode: offer.couponPrefix,
                    discountPercent: offer.discountPercent,
                });

                if (result.success) {
                    // Track sent email
                    await adminClient
                        .from('re_engagement_emails')
                        .insert({
                            customer_email: email,
                            sent_at: new Date().toISOString(),
                            offer_code: offer.couponPrefix,
                            days_since_order: daysSinceOrder,
                        });

                    sentCount++;
                } else {
                    errors.push(`${email}: ${JSON.stringify(result.error)}`);
                }
            } catch (err) {
                errors.push(`${email}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} re-engagement emails`,
            sent: sentCount,
            eligible: customerMap.size - recentCustomers.size - recentlyEmailed.size,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Re-engagement cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
