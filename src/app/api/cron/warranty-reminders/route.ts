import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendWarrantyResubmissionReminder } from '@/lib/email';

// This endpoint should be called by an external cron service
// Run daily at 10:00 AM IST to remind customers to resubmit warranty screenshots

export async function GET(request: NextRequest) {
    // Verify cron secret
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const adminClient = getAdminClient();

        // Find warranty registrations needing resubmission
        const { data: pendingWarranties, error } = await adminClient
            .from('warranty_registrations')
            .select('id, order_id, customer_email, product_name, missing_seller_feedback, missing_product_review, last_reminder_sent_at')
            .eq('status', 'NEEDS_RESUBMISSION')
            .not('customer_email', 'is', null);

        if (error) {
            console.error('Error fetching warranties:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!pendingWarranties || pendingWarranties.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No warranties need resubmission reminders',
                sent: 0,
            });
        }

        // Only send one reminder per day per warranty
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);

        let sentCount = 0;
        const errors: string[] = [];

        for (const warranty of pendingWarranties) {
            // Skip if reminder was sent in the last 24 hours
            if (warranty.last_reminder_sent_at) {
                const lastSent = new Date(warranty.last_reminder_sent_at);
                if (lastSent > oneDayAgo) {
                    continue;
                }
            }

            // Skip Amazon marketplace emails
            if (warranty.customer_email?.includes('@marketplace.amazon')) {
                continue;
            }

            try {
                // Add delay between emails to respect Resend rate limit (2 requests/second)
                if (sentCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }

                const result = await sendWarrantyResubmissionReminder({
                    to: warranty.customer_email,
                    customerName: warranty.customer_email.split('@')[0],
                    orderId: warranty.order_id,
                    productName: warranty.product_name,
                    missingSeller: warranty.missing_seller_feedback || false,
                    missingReview: warranty.missing_product_review || false,
                });

                if (result.success) {
                    // Update last reminder sent timestamp
                    await adminClient
                        .from('warranty_registrations')
                        .update({ last_reminder_sent_at: new Date().toISOString() })
                        .eq('id', warranty.id);

                    sentCount++;
                } else {
                    errors.push(`${warranty.order_id}: ${JSON.stringify(result.error)}`);
                }
            } catch (err) {
                errors.push(`${warranty.order_id}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} warranty reminder emails`,
            sent: sentCount,
            total: pendingWarranties.length,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Warranty reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
