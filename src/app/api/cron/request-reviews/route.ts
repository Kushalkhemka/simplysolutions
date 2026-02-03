/**
 * Cron endpoint to request reviews for Amazon orders via Solicitations API
 * 
 * - Sends review requests for orders 5+ days old (up to 30 days)
 * - Amazon uses their own email template
 * - Tracks which orders have already been solicited
 * 
 * Schedule: Daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const maxDuration = 300; // 5 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID!,
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

async function getAccessToken(): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SP_API_CONFIG.refreshToken,
            client_id: SP_API_CONFIG.clientId,
            client_secret: SP_API_CONFIG.clientSecret,
        }),
    });
    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to get access token');
    }
    return data.access_token;
}

/**
 * Check if solicitation is available for an order
 */
async function checkSolicitationAvailable(accessToken: string, orderId: string): Promise<boolean> {
    try {
        const url = `${SP_API_CONFIG.endpoint}/solicitations/v1/orders/${orderId}?marketplaceIds=${SP_API_CONFIG.marketplaceId}`;

        const response = await fetch(url, {
            headers: { 'x-amz-access-token': accessToken },
        });

        if (!response.ok) {
            return false;
        }

        const data = await response.json();
        // Check if productReviewAndSellerFeedback action is available
        const actions = data._links?.actions || [];
        return actions.some((a: any) => a.name === 'productReviewAndSellerFeedback');
    } catch {
        return false;
    }
}

/**
 * Send review request for an order
 */
async function sendReviewRequest(accessToken: string, orderId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `${SP_API_CONFIG.endpoint}/solicitations/v1/orders/${orderId}/solicitations/productReviewAndSellerFeedback?marketplaceIds=${SP_API_CONFIG.marketplaceId}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'x-amz-access-token': accessToken,
                'Content-Type': 'application/json'
            },
        });

        if (response.ok || response.status === 201) {
            return { success: true };
        }

        // Handle specific errors
        if (response.status === 403) {
            return { success: false, error: 'Not eligible (too early or already sent)' };
        }
        if (response.status === 429) {
            return { success: false, error: 'Rate limited' };
        }

        const errorData = await response.json().catch(() => ({}));
        return {
            success: false,
            error: `API Error ${response.status}: ${errorData.errors?.[0]?.message || 'Unknown'}`
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

// Add delay between API calls
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[request-reviews] Starting review request job...');

        // Calculate date range: 5 to 30 days ago
        const now = new Date();
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get orders that:
        // - Are 5-30 days old
        // - Have not been solicited yet
        // - Are not refunded
        // - Are FBA or MFN (shipped)
        const { data: orders, error: fetchError } = await supabase
            .from('amazon_orders')
            .select('order_id, created_at, review_email_sent_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .lte('created_at', fiveDaysAgo.toISOString())
            .is('review_email_sent_at', null)
            .or('is_refunded.is.null,is_refunded.eq.false')
            .limit(50); // Process max 50 per run to avoid rate limits

        if (fetchError) {
            console.error('[request-reviews] Failed to fetch orders:', fetchError);
            return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
        }

        if (!orders || orders.length === 0) {
            console.log('[request-reviews] No eligible orders found');
            return NextResponse.json({
                success: true,
                message: 'No eligible orders found',
                processed: 0
            });
        }

        console.log(`[request-reviews] Found ${orders.length} orders to process`);

        // Get access token
        const accessToken = await getAccessToken();

        const results = {
            processed: 0,
            success: 0,
            failed: 0,
            errors: [] as { orderId: string; error: string }[]
        };

        // Process each order
        for (const order of orders) {
            results.processed++;

            // Send review request
            const result = await sendReviewRequest(accessToken, order.order_id);

            if (result.success) {
                results.success++;

                // Mark order as solicited
                await supabase
                    .from('amazon_orders')
                    .update({ review_email_sent_at: new Date().toISOString() })
                    .eq('order_id', order.order_id);

                console.log(`[request-reviews] ✓ Sent for ${order.order_id}`);
            } else {
                results.failed++;
                results.errors.push({ orderId: order.order_id, error: result.error || 'Unknown' });

                // Still mark as attempted to avoid retrying
                await supabase
                    .from('amazon_orders')
                    .update({ review_email_sent_at: new Date().toISOString() })
                    .eq('order_id', order.order_id);

                console.log(`[request-reviews] ✗ Failed for ${order.order_id}: ${result.error}`);
            }

            // Rate limiting delay (1 request per second)
            await delay(1000);
        }

        const summary = {
            success: true,
            processed: results.processed,
            reviewsSent: results.success,
            failed: results.failed,
            errors: results.errors.slice(0, 10) // Limit errors in response
        };

        console.log('[request-reviews] Completed:', summary);

        return NextResponse.json(summary);

    } catch (error: any) {
        console.error('[request-reviews] Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
