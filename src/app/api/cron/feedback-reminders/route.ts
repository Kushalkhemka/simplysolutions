import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { sendFeedbackReminder } from '@/lib/whatsapp';

/**
 * Cron job for sending feedback removal reminders
 * - Runs daily at 10:00 AM IST (via cron-job.org)
 * - Maximum 3 reminders per appeal
 * - Skips appeals that already have submitted screenshots
 */

const MAX_REMINDERS = 3;

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

        // Find feedback appeals that need reminders:
        // - Status is PENDING or RESUBMIT
        // - No screenshot submitted yet (or empty)
        // - reminder_count < 3
        const { data: pendingAppeals, error } = await adminClient
            .from('feedback_appeals')
            .select('*')
            .in('status', ['PENDING', 'RESUBMIT'])
            .lt('reminder_count', MAX_REMINDERS)
            .not('phone', 'is', null);

        if (error) {
            console.error('Error fetching appeals:', error);
            return NextResponse.json({ error: 'Database error' }, { status: 500 });
        }

        if (!pendingAppeals || pendingAppeals.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No appeals need reminders',
                sent: 0,
            });
        }

        let sentCount = 0;
        let skippedHasScreenshot = 0;
        let skippedMaxReminders = 0;
        const errors: string[] = [];

        for (const appeal of pendingAppeals) {
            // Skip if already submitted screenshot
            if (appeal.screenshot_url && appeal.screenshot_url.length > 0) {
                skippedHasScreenshot++;
                continue;
            }

            // Skip if exceeded max reminders (safety check)
            if (appeal.reminder_count >= MAX_REMINDERS) {
                skippedMaxReminders++;
                continue;
            }

            // Skip if last reminder was sent today
            if (appeal.last_reminder_at) {
                const lastReminder = new Date(appeal.last_reminder_at);
                const hoursSinceLastReminder = (now.getTime() - lastReminder.getTime()) / (1000 * 60 * 60);
                if (hoursSinceLastReminder < 20) { // At least 20 hours between reminders
                    continue;
                }
            }

            try {
                // Rate limiting: 500ms delay between messages
                if (sentCount > 0) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                }

                const newReminderCount = appeal.reminder_count + 1;

                // Send WhatsApp reminder
                const result = await sendFeedbackReminder(appeal.phone, appeal.order_id);

                if (result.success) {
                    // Update reminder count and timestamp
                    await adminClient
                        .from('feedback_appeals')
                        .update({
                            reminder_count: newReminderCount,
                            last_reminder_at: now.toISOString()
                        })
                        .eq('id', appeal.id);

                    sentCount++;
                    console.log(`Sent reminder ${newReminderCount}/${MAX_REMINDERS} for ${appeal.order_id}`);
                } else {
                    errors.push(`${appeal.order_id}: ${result.error}`);
                }
            } catch (err) {
                errors.push(`${appeal.order_id}: ${err}`);
            }
        }

        return NextResponse.json({
            success: true,
            message: `Sent ${sentCount} feedback reminders`,
            sent: sentCount,
            total: pendingAppeals.length,
            skippedHasScreenshot,
            skippedMaxReminders,
            errors: errors.length > 0 ? errors : undefined,
        });
    } catch (error) {
        console.error('Feedback reminder cron error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
