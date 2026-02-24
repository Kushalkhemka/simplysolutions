/**
 * Cron endpoint to sync Gmail order enquiries
 * Schedule: Every 15 minutes
 * 
 * Features:
 * - Supports multiple Gmail accounts from the database
 * - Falls back to env credentials if no DB accounts exist
 * - Stores enquiries in Supabase for fast loading
 * - Auto-generates AI replies using Gemini
 * - Categorizes enquiries (delivery, refund, product claim, tech support)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchOrderEnquiries, GmailCredentials } from '@/lib/gmail';
import { logCronStart, logCronSuccess, logCronError } from '@/lib/cron/logger';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDycY1_oS7nIu4Qv2QW3_xlB7e-OPx0xHI';

const TEMPLATES: Record<string, string> = {
    tech_support: `Dear [BUYER_NAME],

For quick assistance with this issue, please contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported).

Our WhatsApp support includes automated chatbot assistance for instant replies, followed by manual support from our technical team if required. You may also request your license directly from technical support through this channel.

Additionally, you can find the email copy shared with you in Amazon Buyer–Seller Messaging at amazon.in/message for installation/activation instructions. If the issue persists, you may share the error screenshot via Amazon Buyer–Seller Messaging, and our team will review and respond accordingly.

Thank you for your cooperation.
CODEKEYS`,

    delivery: `Dear [BUYER_NAME],

We would like to inform you that your order has been successfully delivered to your Amazon-registered email address within 1 hour of your purchase time. You can also access a copy of the same by visiting Amazon Messaging Center at amazon.in/msg 

Thanks & Regards
CODEKEYS`,

    cancellation: `Dear [BUYER_NAME],

Thank you for contacting us regarding your order [ORDER_ID].

We would like to clearly inform you that this order was successfully delivered via Digital Delivery. As this product falls under the software category, cancellations or refunds are strictly not permitted once delivery is completed, in accordance with Amazon's Policies and Guidelines. 

Please note that all software products are non-returnable, non-refundable, and non-cancellable after delivery, irrespective of usage status or activation.

If you are experiencing any technical issues, activation errors, or installation difficulties, you may contact our technical support team on WhatsApp at 8178848830 (messages only; calls are not supported). Our support team will assist you with troubleshooting and activation guidance.

We appreciate your understanding and cooperation.

Regards,
CODEKEYS`,
};

function verifyCronAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true;
    return authHeader === `Bearer ${cronSecret}`;
}

async function generateAIReply(enquiry: {
    customerName: string;
    orderId: string;
    product: string;
    reason: string;
    category: string;
    body: string;
}): Promise<{ reply: string; templateUsed: string }> {
    const systemPrompt = `You are a customer support representative for CODEKEYS, an Amazon seller that sells digital software licenses (Microsoft Office 365, Windows 10/11 Pro keys, AutoCAD, etc.).

Your task is to generate a professional reply to the customer's enquiry. You MUST:
1. First determine the best template category (tech_support, delivery, or cancellation)
2. Use that template as a base
3. Adapt/augment it for the specific customer's situation
4. Replace [BUYER_NAME] with the customer's actual name
5. Replace [ORDER_ID] with the actual order ID

AVAILABLE TEMPLATES:

TECH SUPPORT (for activation issues, key errors, installation problems):
${TEMPLATES.tech_support}

DELIVERY (for delivery/shipping status queries):
${TEMPLATES.delivery}

CANCELLATION (for refund/cancellation requests):
${TEMPLATES.cancellation}

CRITICAL RULES:
- If customer claims the product is pirated, fake, counterfeit, or non-genuine: Ask for proof/screenshot via Amazon Buyer-Seller Messaging. Politely state your products are 100% genuine.
- NEVER agree to a refund, replacement, or compensation. Do NOT make any commitments or promises on behalf of the seller. For refund/cancellation requests, redirect the customer to the tech support team (WhatsApp 8178848830) using the TECH SUPPORT template. Ask the customer to share a screenshot or proof of their claim via Amazon Buyer-Seller Messaging for review by the team.
- Keep the response professional, concise, and empathetic
- Do not add any markdown formatting
- Do not add any sign-off or signature at the end of the reply

Respond in this exact format:
TEMPLATE: [template_name]
---
[reply text]`;

    const userPrompt = `Customer Name: ${enquiry.customerName || 'Customer'}
Order ID: ${enquiry.orderId || 'N/A'}
Product: ${enquiry.product || 'Digital Software License'}
Category: ${enquiry.category || 'general'}
Reason: ${enquiry.reason || 'Not specified'}

Customer's Message:
${enquiry.body?.substring(0, 1500) || enquiry.reason || 'No message available'}`;

    try {
        const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1024 },
                }),
            }
        );

        const data = await res.json();

        // Check for API errors
        if (data.error) {
            throw new Error(data.error.message || 'Gemini API error');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

        if (!text) {
            throw new Error('Empty response from Gemini');
        }

        const templateMatch = text.match(/TEMPLATE:\s*(\w+)/i);
        const templateUsed = templateMatch ? templateMatch[1].toLowerCase() : enquiry.category;
        const replyMatch = text.split('---');
        const reply = replyMatch.length > 1 ? replyMatch.slice(1).join('---').trim() : text.trim();

        return { reply, templateUsed };
    } catch (error) {
        console.error('[sync-gmail] AI generation error:', error);
        const categoryToTemplate: Record<string, string> = {
            delivery: 'delivery',
            refund: 'cancellation',
            product_claim: 'cancellation',
            tech_support: 'tech_support',
            other: 'tech_support',
        };
        const templateKey = categoryToTemplate[enquiry.category] || 'tech_support';
        let fallbackReply = TEMPLATES[templateKey];
        fallbackReply = fallbackReply.replace(/\[BUYER_NAME\]/g, enquiry.customerName || 'Customer');
        fallbackReply = fallbackReply.replace(/\[ORDER_ID\]/g, enquiry.orderId || 'N/A');
        return { reply: fallbackReply, templateUsed: templateKey };
    }
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
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
                aiGenerated: 0,
                duration: `${Date.now() - startTime}ms`,
            });
        }

        let totalNew = 0;
        let totalAI = 0;
        let totalEnquiries = 0;
        const accountResults: Array<{ email: string; total: number; new: number; aiGenerated: number; error?: string }> = [];

        for (const account of accountsToSync) {
            try {
                // Fetch enquiries from this account
                const enquiries = await fetchOrderEnquiries(account.creds);
                totalEnquiries += enquiries.length;

                if (enquiries.length === 0) {
                    accountResults.push({ email: account.email, total: 0, new: 0, aiGenerated: 0 });
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
                const existingWithAI = new Set(
                    (existing || []).filter((e: any) => e.ai_suggested_reply).map((e: any) => e.id)
                );

                let accountNew = 0;
                let accountAI = 0;

                for (const enquiry of enquiries) {
                    const isNew = !existingIds.has(enquiry.id);
                    const needsAI = !existingWithAI.has(enquiry.id);

                    let aiReply = '';
                    let templateUsed = '';

                    if (needsAI) {
                        const result = await generateAIReply({
                            customerName: enquiry.customerName,
                            orderId: enquiry.orderId,
                            product: enquiry.product,
                            reason: enquiry.reason,
                            category: enquiry.category,
                            body: enquiry.body,
                        });
                        aiReply = result.reply;
                        templateUsed = result.templateUsed;
                        accountAI++;
                        await new Promise(resolve => setTimeout(resolve, 300));
                    }

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

                    if (needsAI && aiReply) {
                        record.ai_suggested_reply = aiReply;
                        record.ai_template_used = templateUsed;
                    }

                    const { error } = await supabase.from('gmail_enquiries').upsert(record, { onConflict: 'id' });

                    if (error) {
                        console.error(`[sync-gmail] Error upserting ${enquiry.id}:`, error.message);
                    } else if (isNew) {
                        accountNew++;
                    }
                }

                totalNew += accountNew;
                totalAI += accountAI;
                accountResults.push({ email: account.email, total: enquiries.length, new: accountNew, aiGenerated: accountAI });

                // Update last_synced_at
                if (account.id) {
                    await supabase.from('gmail_accounts').update({ last_synced_at: new Date().toISOString() }).eq('id', account.id);
                }
            } catch (error) {
                const errorMsg = error instanceof Error ? error.message : 'Unknown error';
                console.error(`[sync-gmail] Error syncing ${account.email}:`, errorMsg);
                accountResults.push({ email: account.email, total: 0, new: 0, aiGenerated: 0, error: errorMsg });
            }
        }

        await logCronSuccess(logId, totalNew, {
            totalEnquiries,
            newEnquiries: totalNew,
            aiGenerated: totalAI,
            accounts: accountResults,
        });

        return NextResponse.json({
            success: true,
            message: 'Gmail enquiries synced',
            accounts: accountResults,
            total: totalEnquiries,
            new: totalNew,
            aiGenerated: totalAI,
            duration: `${Date.now() - startTime}ms`,
        });
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logCronError(logId, errorMessage);
        return NextResponse.json(
            { success: false, error: errorMessage, duration: `${Date.now() - startTime}ms` },
            { status: 500 }
        );
    }
}
