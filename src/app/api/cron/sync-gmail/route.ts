/**
 * Cron endpoint to sync Gmail order enquiries
 * Schedule: Every 15 minutes (configured in vercel.json)
 *
 * Features:
 * - Supports multiple Gmail accounts from the database
 * - Falls back to env credentials if no DB accounts exist
 * - Stores enquiries in Supabase for fast loading
 * - Deterministically selects the best template based on enquiry category
 * - Categorizes enquiries (delivery, refund, product claim, tech support)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchOrderEnquiries, sendGmailReply, GmailCredentials } from '@/lib/gmail';
import { logCronStart, logCronSuccess, logCronError } from '@/lib/cron/logger';

const TEMPLATES: Record<string, string> = {
    tech_support: `Dear [BUYER_NAME],

For quick assistance with this issue, please contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported).

Our WhatsApp support includes automated chatbot assistance for instant replies, followed by manual support from our technical team if required. You may also request your license directly from technical support through this channel.

Additionally, you can find the email copy shared with you in Amazon Buyer\u2013Seller Messaging at amazon.in/message for installation/activation instructions.

If the issue persists, you may share the error screenshot via Amazon Buyer\u2013Seller Messaging, and our team will review and respond accordingly.

Thanks for your cooperation & patience.`,

    delivery: `Dear [BUYER_NAME],

We would like to inform you that your order has been successfully delivered to your Amazon-registered email address within 1 hour of your purchase time. You can also access a copy of the same by visiting Amazon Messaging Center at amazon.in/msg

For quick assistance with this issue, please contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported). Our WhatsApp support includes automated chatbot assistance for instant replies, followed by manual support from our technical team if required.

Thanks for your cooperation & patience.`,

    cancellation: `Dear [BUYER_NAME],

Thank you for contacting us regarding your order [ORDER_ID].

We would like to clearly inform you that this order was successfully delivered via Digital Delivery. As this product falls under the software category, cancellations or refunds are strictly not permitted once delivery is completed, in accordance with Amazon's Policies and Guidelines.

Please note that all software products are non-returnable, non-refundable, and non-cancellable after delivery, irrespective of usage status or activation.

If you are experiencing any technical issues, activation errors, or installation difficulties, you may contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported).

Our support team will assist you with troubleshooting and activation guidance.

We appreciate your understanding and cooperation.

Thanks for your cooperation & patience.`,
};


// Deterministic category → template mapping (no AI needed)
const CATEGORY_TO_TEMPLATE: Record<string, string> = {
    delivery: 'delivery',
    refund: 'cancellation',
    product_claim: 'cancellation',
    tech_support: 'tech_support',
    other: 'tech_support',
};

const PRODUCT_CLAIM_APPENDIX = `\n\nPlease share the screenshot of the claim made here for further review and resolution.Meanwhile you can reach out to our tech support team on WhatsApp at 8178848830 for faster resolution.`;

function selectTemplate(category: string, customerName: string, orderId: string): { reply: string; templateUsed: string } {
    const templateKey = CATEGORY_TO_TEMPLATE[category] || 'tech_support';
    let reply = TEMPLATES[templateKey];
    reply = reply.replace(/\[BUYER_NAME\]/g, customerName || 'Customer');
    reply = reply.replace(/\[ORDER_ID\]/g, orderId || 'N/A');

    // For product claims (fake/pirated/defective/invalid), append screenshot request
    if (category === 'product_claim') {
        // Insert before the closing signature line
        const sigIndex = reply.lastIndexOf('\n\nRegards,');
        if (sigIndex !== -1) {
            reply = reply.slice(0, sigIndex) + PRODUCT_CLAIM_APPENDIX + reply.slice(sigIndex);
        } else {
            reply = reply + PRODUCT_CLAIM_APPENDIX;
        }
    }

    return { reply, templateUsed: templateKey };
}

async function verifyCronAuth(request: NextRequest): Promise<boolean> {
    // 1. Check Bearer token (used by Coolify cron / direct calls)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
        return true;
    }
    // If no CRON_SECRET is set, allow all requests
    if (!cronSecret) return true;

    // 2. Fallback: check admin session (used by Sync Now button via browser cookies)
    try {
        const { createClient } = await import('@/lib/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        return profile?.role === 'admin' || profile?.role === 'super_admin';
    } catch {
        return false;
    }
}

export async function GET(request: NextRequest) {
    if (!(await verifyCronAuth(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const logId = await logCronStart('sync-gmail');

    try {
        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Determine which accounts to sync
        let accountsToSync: Array<{ id?: string; email: string; creds: GmailCredentials }> = [];

        // Try to read accounts from the database
        const { data: dbAccounts } = await supabase
            .from('gmail_accounts')
            .select('*')
            .eq('is_active', true);

        if (dbAccounts && dbAccounts.length > 0) {
            // Use database accounts
            accountsToSync = dbAccounts.map((acc: any) => ({
                id: acc.id,
                email: acc.email,
                creds: {
                    clientId: acc.client_id,
                    clientSecret: acc.client_secret,
                    refreshToken: acc.refresh_token,
                    email: acc.email,
                },
            }));
        } else {
            // Fallback to env credentials
            const envClientId = process.env.GMAIL_CLIENT_ID;
            const envClientSecret = process.env.GMAIL_CLIENT_SECRET;
            const envRefreshToken = process.env.GMAIL_REFRESH_TOKEN;
            const envEmail = process.env.GMAIL_USER_EMAIL || 'codekeys.amazon@gmail.com';

            if (envClientId && envClientSecret && envRefreshToken) {
                accountsToSync.push({
                    email: envEmail,
                    creds: {
                        clientId: envClientId,
                        clientSecret: envClientSecret,
                        refreshToken: envRefreshToken,
                        email: envEmail,
                    },
                });
            }
        }

        if (accountsToSync.length === 0) {
            await logCronSuccess(logId, 0, { message: 'No accounts configured' });
            return NextResponse.json({
                success: true,
                message: 'No Gmail accounts configured',
                synced: 0,
                templated: 0,
                duration: `${Date.now() - startTime} ms`,
            });
        }

        let totalNew = 0;
        let totalTemplated = 0;
        let totalEnquiries = 0;
        const accountResults: Array<{ email: string; total: number; new: number; templated: number; error?: string }> = [];

        for (const account of accountsToSync) {
            try {
                // Fetch enquiries from this account
                const enquiries = await fetchOrderEnquiries(account.creds);
                totalEnquiries += enquiries.length;

                if (enquiries.length === 0) {
                    accountResults.push({ email: account.email, total: 0, new: 0, templated: 0 });
                    // Update last_synced_at
                    if (account.id) {
                        await supabase.from('gmail_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);
                    }
                    continue;
                }

                // Check existing
                const ids = enquiries.map(e => e.id);
                const { data: existing } = await supabase
                    .from('gmail_enquiries')
                    .select('id, ai_suggested_reply')
                    .in('id', ids);

                const existingIds = new Set((existing || []).map((e: any) => e.id));
                const existingWithReply = new Set(
                    (existing || []).filter((e: any) => e.ai_suggested_reply).map((e: any) => e.id)
                );

                let accountNew = 0;
                let accountTemplated = 0;

                for (const enquiry of enquiries) {
                    const isNew = !existingIds.has(enquiry.id);
                    const needsReply = !existingWithReply.has(enquiry.id);

                    const record: any = {
                        id: enquiry.id,
                        thread_id: enquiry.threadId,
                        message_id: enquiry.messageId,
                        from_address: enquiry.from,
                        to_address: enquiry.to,
                        subject: enquiry.subject,
                        date: new Date(enquiry.date).toISOString(),
                        snippet: enquiry.snippet,
                        body: enquiry.body,
                        labels: enquiry.labels,
                        customer_name: enquiry.customerName,
                        order_id: enquiry.orderId,
                        product: enquiry.product,
                        return_requested: enquiry.returnRequested,
                        reason: enquiry.reason,
                        category: enquiry.category,
                        is_read: !enquiry.labels.includes('UNREAD'),
                        synced_at: new Date().toISOString(),
                        account_email: account.email,
                    };

                    if (account.id) record.account_id = account.id;

                    // Deterministically select the right template — instant, no AI needed
                    if (needsReply) {
                        const { reply, templateUsed } = selectTemplate(
                            enquiry.category,
                            enquiry.customerName,
                            enquiry.orderId
                        );
                        record.ai_suggested_reply = reply;
                        record.ai_template_used = templateUsed;
                        accountTemplated++;
                    }

                    const { error } = await supabase.from('gmail_enquiries').upsert(record, { onConflict: 'id' });

                    if (error) {
                        console.error(`[sync-gmail] Error upserting ${enquiry.id}:`, error.message);
                    } else if (isNew) {
                        accountNew++;

                        // Auto-reply: send the template reply immediately for new enquiries
                        if (record.ai_suggested_reply) {
                            try {
                                await sendGmailReply({
                                    threadId: enquiry.threadId,
                                    inReplyTo: enquiry.messageId,
                                    to: enquiry.from,
                                    subject: enquiry.subject,
                                    body: record.ai_suggested_reply,
                                    creds: account.creds,
                                });
                                // Mark as replied in DB
                                await supabase.from('gmail_enquiries')
                                    .update({ is_replied: true, replied_at: new Date().toISOString() })
                                    .eq('id', enquiry.id);
                            } catch (replyErr) {
                                console.error(`[sync-gmail] Auto-reply failed for ${enquiry.id}:`, replyErr);
                            }
                        }
                    }
                }

                totalNew += accountNew;
                totalTemplated += accountTemplated;
                accountResults.push({ email: account.email, total: enquiries.length, new: accountNew, templated: accountTemplated });

                // Update last_synced_at
                if (account.id) {
                    await supabase.from('gmail_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[sync - gmail] Error syncing ${account.email}: `, errorMsg);
                accountResults.push({ email: account.email, total: 0, new: 0, templated: 0, error: errorMsg });
            }
        }

        await logCronSuccess(logId, totalNew, {
            totalEnquiries,
            newEnquiries: totalNew,
            templated: totalTemplated,
            accounts: accountResults,
        });

        return NextResponse.json({
            success: true,
            message: 'Gmail enquiries synced',
            accounts: accountResults,
            total: totalEnquiries,
            new: totalNew,
            templated: totalTemplated,
            duration: `${Date.now() - startTime} ms`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logCronError(logId, errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage, duration: `${Date.now() - startTime} ms` },
            { status: 500 }
        );
    }
}
