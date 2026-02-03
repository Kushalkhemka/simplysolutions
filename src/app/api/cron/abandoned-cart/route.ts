/**
 * Cron endpoint to send abandoned cart recovery emails
 * 
 * Features:
 * - Finds carts with items > 2 hours old
 * - Sends up to 3 reminder emails per cart
 * - 24 hour minimum between reminders
 * - Skips guest carts without email
 * 
 * Schedule: Every 4 hours
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';
import { logCronStart, logCronSuccess, logCronError } from '@/lib/cron/logger';
import {
    getAbandonedCartEmailHtml,
    getAbandonedCartEmailSubject
} from '@/lib/emails/abandoned-cart-email';

const resend = new Resend(process.env.RESEND_API_KEY);

export const maxDuration = 60; // 1 minute

function verifyCronAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true;
    return authHeader === `Bearer ${cronSecret}`;
}

interface CartItem {
    id: string;
    user_id: string | null;
    quantity: number;
    added_at: string;
    reminder_count: number;
    reminder_sent_at: string | null;
    product: {
        id: string;
        name: string;
        price: number;
        main_image_url: string | null;
    };
}

interface UserInfo {
    id: string;
    email: string;
    full_name: string | null;
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const logId = await logCronStart('abandoned-cart');

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        console.log('[abandoned-cart] Starting abandoned cart recovery...');

        // Calculate time thresholds
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

        // Find cart items that:
        // - Were added more than 2 hours ago
        // - Have reminder_count < 3
        // - Either never had a reminder OR last reminder was > 24 hours ago
        // - Have a user_id (logged in users only - we need their email)
        const { data: cartItems, error: cartError } = await supabase
            .from('cart_items')
            .select(`
                id,
                user_id,
                quantity,
                added_at,
                reminder_count,
                reminder_sent_at,
                product:products(id, name, price, main_image_url)
            `)
            .not('user_id', 'is', null)
            .lt('added_at', twoHoursAgo)
            .lt('reminder_count', 3)
            .or(`reminder_sent_at.is.null,reminder_sent_at.lt.${oneDayAgo}`)
            .limit(50);

        if (cartError) {
            throw new Error(`Failed to fetch cart items: ${cartError.message}`);
        }

        if (!cartItems || cartItems.length === 0) {
            await logCronSuccess(logId, 0, { message: 'No abandoned carts found' });
            return NextResponse.json({
                success: true,
                message: 'No abandoned carts to process',
                emailsSent: 0
            });
        }

        console.log(`[abandoned-cart] Found ${cartItems.length} cart items to process`);

        // Group cart items by user
        const cartsByUser = new Map<string, CartItem[]>();
        for (const rawItem of cartItems as any[]) {
            if (!rawItem.user_id) continue;

            // Product is returned as an object from the joined select
            const product = rawItem.product;
            if (!product) continue;

            const item: CartItem = {
                id: rawItem.id,
                user_id: rawItem.user_id,
                quantity: rawItem.quantity,
                added_at: rawItem.added_at,
                reminder_count: rawItem.reminder_count || 0,
                reminder_sent_at: rawItem.reminder_sent_at,
                product: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    main_image_url: product.main_image_url
                }
            };

            const existing = cartsByUser.get(item.user_id!) || [];
            existing.push(item);
            cartsByUser.set(item.user_id!, existing);
        }

        // Get user details for each user with abandoned cart
        const userIds = Array.from(cartsByUser.keys());
        const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, email, full_name')
            .in('id', userIds);

        if (usersError) {
            throw new Error(`Failed to fetch users: ${usersError.message}`);
        }

        const userMap = new Map<string, UserInfo>();
        for (const user of (users || []) as UserInfo[]) {
            if (user.email) {
                userMap.set(user.id, user);
            }
        }

        let emailsSent = 0;
        let errors = 0;
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';

        // Process each user's abandoned cart
        for (const [userId, items] of cartsByUser) {
            const user = userMap.get(userId);
            if (!user) {
                console.log(`[abandoned-cart] Skipping user ${userId} - no email found`);
                continue;
            }

            // Get the minimum reminder count for this user's items
            const minReminderCount = Math.min(...items.map(i => i.reminder_count || 0));
            const newReminderNumber = minReminderCount + 1;

            // Prepare email content
            const emailItems = items.map(item => ({
                name: item.product.name,
                price: item.product.price * item.quantity,
                imageUrl: item.product.main_image_url || undefined
            }));

            try {
                // Send email
                await resend.emails.send({
                    from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
                    to: user.email,
                    subject: getAbandonedCartEmailSubject(newReminderNumber),
                    html: getAbandonedCartEmailHtml({
                        customerName: user.full_name || undefined,
                        items: emailItems,
                        cartUrl: `${appUrl}/cart`,
                        reminderNumber: newReminderNumber
                    })
                });

                // Update reminder tracking for all items in this cart
                const itemIds = items.map(i => i.id);
                await supabase
                    .from('cart_items')
                    .update({
                        reminder_sent_at: new Date().toISOString(),
                        reminder_count: newReminderNumber
                    })
                    .in('id', itemIds);

                emailsSent++;
                console.log(`[abandoned-cart] Sent reminder #${newReminderNumber} to ${user.email}`);

            } catch (emailError) {
                console.error(`[abandoned-cart] Failed to send email to ${user.email}:`, emailError);
                errors++;
            }

            // Small delay between emails to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 200));
        }

        const summary = {
            success: true,
            emailsSent,
            errors,
            usersProcessed: cartsByUser.size
        };

        await logCronSuccess(logId, emailsSent, summary);

        console.log('[abandoned-cart] Completed:', summary);

        return NextResponse.json(summary);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[abandoned-cart] Error:', errorMessage);
        await logCronError(logId, errorMessage);
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
