/**
 * Cron endpoint to request reviews for Amazon orders via Solicitations API
 * 
 * Features:
 * - Supports multiple seller accounts (stored in database)
 * - Sends review requests for orders 5+ days old (up to 30 days)
 * - Amazon uses their own email template
 * - Tracks which orders have already been solicited
 * 
 * Schedule: Daily
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    getActiveSellerAccounts,
    SellerAccountWithCredentials
} from '@/lib/amazon/seller-accounts';

export const maxDuration = 300; // 5 minutes

// India marketplace (A21TJRUUN4KGV) uses the EU region endpoint
const SP_API_ENDPOINT = 'https://sellingpartnerapi-eu.amazon.com';

async function getAccessToken(account: SellerAccountWithCredentials): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: account.clientId,
            client_secret: account.clientSecret,
        }),
    });
    const data = await response.json();
    if (!data.access_token) {
        throw new Error('Failed to get access token');
    }
    return data.access_token;
}

/**
 * Send review request for an order
 */
async function sendReviewRequest(
    accessToken: string,
    marketplaceId: string,
    orderId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const url = `${SP_API_ENDPOINT}/solicitations/v1/orders/${orderId}/solicitations/productReviewAndSellerFeedback?marketplaceIds=${marketplaceId}`;

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
    } catch (error: unknown) {
        return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
}

// Add delay between API calls
function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function requestReviewsForAccount(
    account: SellerAccountWithCredentials,
    supabase: any
): Promise<{ processed: number; success: number; failed: number }> {
    try {
        const accessToken = await getAccessToken(account);

        // Calculate date range: 5 to 30 days ago
        const now = new Date();
        const fiveDaysAgo = new Date(now);
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        // Get orders for this seller account that:
        // - Are 5-30 days old
        // - Have not been solicited yet
        // - Are not refunded
        let query = supabase
            .from('amazon_orders')
            .select('order_id, created_at, review_email_sent_at')
            .gte('created_at', thirtyDaysAgo.toISOString())
            .lte('created_at', fiveDaysAgo.toISOString())
            .is('review_email_sent_at', null)
            .or('is_refunded.is.null,is_refunded.eq.false')
            .limit(30); // Process max 30 per account per run to avoid rate limits

        // Filter by seller account if available
        if (account.id) {
            query = query.eq('seller_account_id', account.id);
        }

        const { data: orders, error: fetchError } = await query;

        if (fetchError || !orders || orders.length === 0) {
            return { processed: 0, success: 0, failed: 0 };
        }

        const results = { processed: 0, success: 0, failed: 0 };

        // Process each order
        for (const order of orders) {
            results.processed++;

            // Send review request
            const result = await sendReviewRequest(accessToken, account.marketplaceId, order.order_id);

            if (result.success) {
                results.success++;
            } else {
                results.failed++;
            }

            // Mark order as solicited (whether successful or not to avoid retrying)
            await supabase
                .from('amazon_orders')
                .update({ review_email_sent_at: new Date().toISOString() })
                .eq('order_id', order.order_id);

            // Rate limiting delay (1 request per second)
            await delay(1000);
        }

        return results;

    } catch (error) {
        console.error(`[request-reviews] Error for account ${account.name}:`, error);
        return { processed: 0, success: 0, failed: 0 };
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[request-reviews] Starting review request job...');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all active seller accounts (ordered by priority)
        const accounts = await getActiveSellerAccounts();

        if (accounts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active seller accounts configured',
                accountsProcessed: 0,
                totalProcessed: 0,
                totalSuccess: 0,
                totalFailed: 0
            });
        }

        // Process each seller account
        const results: { accountName: string; processed: number; success: number; failed: number }[] = [];
        let totalProcessed = 0;
        let totalSuccess = 0;
        let totalFailed = 0;

        for (const account of accounts) {
            console.log(`[request-reviews] Processing account: ${account.name}`);

            const result = await requestReviewsForAccount(account, supabase);

            results.push({
                accountName: account.name,
                processed: result.processed,
                success: result.success,
                failed: result.failed
            });

            totalProcessed += result.processed;
            totalSuccess += result.success;
            totalFailed += result.failed;

            // Small delay between accounts
            if (accounts.length > 1) {
                await delay(500);
            }
        }

        const summary = {
            success: true,
            accountsProcessed: accounts.length,
            totalProcessed,
            totalSuccess,
            totalFailed,
            results
        };

        console.log('[request-reviews] Completed:', summary);

        return NextResponse.json(summary);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[request-reviews] Error:', errorMessage);
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
