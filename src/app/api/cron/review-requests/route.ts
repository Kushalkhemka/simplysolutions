import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendReviewRequestEmail } from '@/lib/email';

// This endpoint should be called by an external cron service (e.g., cron-job.org, Vercel Cron)
// Run daily at 10:00 AM IST

export async function GET(request: NextRequest) {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminClient = getAdminClient();

        // Calculate the date 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
        const startOfDay = new Date(threeDaysAgo);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(threeDaysAgo);
        endOfDay.setHours(23, 59, 59, 999);

        // Find orders activated exactly 3 days ago that haven't received review email
        const { data: orders, error } = await adminClient
            .from('amazon_orders')
            .select('*')
            .eq('status', 'activated')
            .gte('activated_at', startOfDay.toISOString())
            .lt('activated_at', endOfDay.toISOString())
            .is('review_email_sent_at', null)
            .not('customer_email', 'is', null);

        if (error) {
            console.error('Error fetching orders for review emails:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No orders to send review emails for',
                sent: 0,
            });
        }

        let sentCount = 0;
        const errors: string[] = [];

        for (const order of orders) {
            try {
                // Send review request email
                const result = await sendReviewRequestEmail({
                    to: order.customer_email,
                    customerName: order.customer_name || order.customer_email.split('@')[0],
                    orderId: order.order_id,
                    productName: order.product_name || 'your product',
                });

                if (result.success) {
                    // Mark as sent
                    await adminClient
                        .from('amazon_orders')
                        .update({ review_email_sent_at: new Date().toISOString() })
                        .eq('id', order.id);

                    sentCount++;
                } else {
                    errors.push(`Order ${order.order_id}: ${JSON.stringify(result.error)}`);
                }
            } catch (err) {
                errors.push(`Order ${order.order_id}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} review request emails`,
            sent: sentCount,
            total: orders.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Review request cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
