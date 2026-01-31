import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendWarrantyResubmissionReminder } from '@/lib/email';

// This endpoint should be called by an external cron service (e.g., cron-job.org)
// Run daily at 10:00 AM IST to remind customers to resubmit warranty screenshots
// Logic: Send reminder every 2 days, maximum 3 reminders total

const MAX_REMINDERS = 3;
const REMINDER_INTERVAL_DAYS = 2;

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

        // Find warranty registrations needing resubmission
        const { data: pendingWarranties, error } = await adminClient
            .from('warranty_registrations')
            .select('id, order_id, customer_email, product_name, missing_seller_feedback, missing_product_review, last_reminder_sent_at, reminder_count, created_at')
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

        // Calculate the date threshold (2 days ago)
        const reminderThresholdDate = new Date();
        reminderThresholdDate.setDate(reminderThresholdDate.getDate() - REMINDER_INTERVAL_DAYS);

        let sentCount = 0;
        let skippedMaxReminders = 0;
        let skippedTooRecent = 0;
        const errors: string[] = [];

        for (const warranty of pendingWarranties) {
            // Get reminder count (default to 0 if column doesn't exist yet)
            const currentReminderCount = warranty.reminder_count ?? 0;

            // Skip if already sent max reminders
            if (currentReminderCount >= MAX_REMINDERS) {
                skippedMaxReminders++;
                continue;
            }

            // Check when the last reminder was sent
            // If no reminder sent yet, use the created_at date as reference
            const lastActionDate = warranty.last_reminder_sent_at
                ? new Date(warranty.last_reminder_sent_at)
                : new Date(warranty.created_at);

            // Skip if less than 2 days since last reminder/creation
            if (lastActionDate > reminderThresholdDate) {
                skippedTooRecent++;
                continue;
            }

            // Skip Amazon marketplace emails (they can't receive emails)
            if (warranty.customer_email?.includes('@marketplace.amazon')) {
                continue;
            }

            try {
                // Add delay between emails to respect Resend rate limit (2 requests/second)
                if (sentCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 600));
                }

                const newReminderCount = currentReminderCount + 1;

                const result = await sendWarrantyResubmissionReminder({
                    to: warranty.customer_email,
                    customerName: warranty.customer_email.split('@')[0],
                    orderId: warranty.order_id,
                    productName: warranty.product_name,
                    missingSeller: warranty.missing_seller_feedback || false,
                    missingReview: warranty.missing_product_review || false,
                    reminderNumber: newReminderCount,
                    maxReminders: MAX_REMINDERS,
                });

                if (result.success) {
                    // Update reminder count and timestamp
                    await adminClient
                        .from('warranty_registrations')
                        .update({
                            last_reminder_sent_at: now.toISOString(),
                            reminder_count: newReminderCount
                        })
                        .eq('id', warranty.id);

                    sentCount++;
                    console.log(`Sent reminder ${newReminderCount}/${MAX_REMINDERS} for order ${warranty.order_id}`);
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
            skippedMaxReminders,
            skippedTooRecent,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Warranty reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
