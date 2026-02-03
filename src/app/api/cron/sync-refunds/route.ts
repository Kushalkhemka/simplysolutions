/**
 * Cron endpoint to sync refund status for all Amazon orders
 * 
 * EFFICIENT APPROACH: Fetches ALL refund transactions in date range (60 days)
 * instead of checking each order individually.
 * 
 * Features:
 * - Supports multiple seller accounts (stored in database)
 * 
 * Schedule: Every 6 hours
 * Timeout: 15 minutes (900s on Coolify)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    getActiveSellerAccounts,
    SellerAccountWithCredentials
} from '@/lib/amazon/seller-accounts';

// Coolify hosting - can use longer timeouts
export const maxDuration = 900; // 15 minutes

const SP_API_ENDPOINT = 'https://sellingpartnerapi-fe.amazon.com';

interface RefundTransaction {
    orderId: string;
    refundDate: string;
    refundAmount: number;
    refundId: string;
}

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
        throw new Error('Failed to get access token: ' + JSON.stringify(data));
    }
    return data.access_token;
}

/**
 * Fetch ALL transactions in date range (paginated)
 * Filter for Refund type transactions
 */
async function fetchAllRefundTransactions(
    accessToken: string,
    postedAfter: Date
): Promise<RefundTransaction[]> {
    const refunds: RefundTransaction[] = [];
    let nextToken: string | null = null;
    let pageCount = 0;
    const maxPages = 50; // Safety limit

    do {
        const url = new URL(`${SP_API_ENDPOINT}/finances/2024-06-19/transactions`);
        url.searchParams.set('postedAfter', postedAfter.toISOString());

        if (nextToken) {
            url.searchParams.set('nextToken', nextToken);
        }

        const response = await fetch(url.toString(), {
            headers: { 'x-amz-access-token': accessToken },
        });

        if (!response.ok) {
            if (response.status === 429) {
                console.log('[sync-refunds] Rate limited, waiting 5 seconds...');
                await new Promise(r => setTimeout(r, 5000));
                continue;
            }
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        const transactions = result.payload?.transactions || result.transactions || [];

        // Filter for refund transactions and extract order IDs
        for (const tx of transactions) {
            if (tx.transactionType?.toLowerCase().includes('refund')) {
                const orderIdInfo = tx.relatedIdentifiers?.find(
                    (r: any) => r.relatedIdentifierName === 'ORDER_ID'
                );

                if (orderIdInfo) {
                    refunds.push({
                        orderId: orderIdInfo.relatedIdentifierValue,
                        refundDate: tx.postedDate,
                        refundAmount: Math.abs(tx.totalAmount?.currencyAmount || 0),
                        refundId: tx.relatedIdentifiers?.find(
                            (r: any) => r.relatedIdentifierName === 'REFUND_ID'
                        )?.relatedIdentifierValue || 'unknown'
                    });
                }
            }
        }

        nextToken = result.payload?.nextToken || result.nextToken || null;
        pageCount++;

        // Rate limiting delay between pages
        if (nextToken) {
            await new Promise(r => setTimeout(r, 300));
        }

    } while (nextToken && pageCount < maxPages);

    return refunds;
}

async function syncRefundsForAccount(
    account: SellerAccountWithCredentials,
    supabase: any
): Promise<{ refundsFound: number; ordersUpdated: number; error?: string }> {
    try {
        const accessToken = await getAccessToken(account);

        // Calculate date range (60 days ago)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Fetch ALL refund transactions in date range
        const refundTransactions = await fetchAllRefundTransactions(accessToken, sixtyDaysAgo);

        if (refundTransactions.length === 0) {
            return { refundsFound: 0, ordersUpdated: 0 };
        }

        // Get unique order IDs
        const refundedOrderIds = [...new Set(refundTransactions.map(r => r.orderId))];

        // Check which orders exist in our database and are not already marked as refunded
        const { data: existingOrders, error: fetchError } = await supabase
            .from('amazon_orders')
            .select('order_id, is_refunded')
            .in('order_id', refundedOrderIds);

        if (fetchError) {
            throw new Error('Failed to fetch orders from database');
        }

        // Filter to orders that need updating (exist + not already refunded)
        const ordersToUpdate = existingOrders
            ?.filter((o: { order_id: string; is_refunded: boolean }) => !o.is_refunded)
            .map((o: { order_id: string; is_refunded: boolean }) => o.order_id) || [];

        // Update refunded orders in database
        let updatedCount = 0;
        if (ordersToUpdate.length > 0) {
            const { count } = await supabase
                .from('amazon_orders')
                .update({
                    is_refunded: true,
                    updated_at: new Date().toISOString()
                })
                .in('order_id', ordersToUpdate);

            updatedCount = count || ordersToUpdate.length;
        }

        return {
            refundsFound: refundTransactions.length,
            ordersUpdated: updatedCount
        };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return { refundsFound: 0, ordersUpdated: 0, error: errorMessage };
    }
}

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[sync-refunds] Starting bulk refund sync...');

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Get all active seller accounts
        const accounts = await getActiveSellerAccounts();

        if (accounts.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No active seller accounts configured',
                accountsProcessed: 0,
                totalRefundsFound: 0,
                totalOrdersUpdated: 0
            });
        }

        // Process each seller account
        const results: { accountName: string; refundsFound: number; ordersUpdated: number; error?: string }[] = [];
        let totalRefundsFound = 0;
        let totalOrdersUpdated = 0;

        for (const account of accounts) {
            console.log(`[sync-refunds] Processing account: ${account.name} (${account.merchantToken})`);

            const result = await syncRefundsForAccount(account, supabase);

            results.push({
                accountName: account.name,
                refundsFound: result.refundsFound,
                ordersUpdated: result.ordersUpdated,
                error: result.error
            });

            totalRefundsFound += result.refundsFound;
            totalOrdersUpdated += result.ordersUpdated;

            // Small delay between accounts to avoid rate limiting
            if (accounts.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        const summary = {
            success: true,
            accountsProcessed: accounts.length,
            totalRefundsFound,
            totalOrdersUpdated,
            results
        };

        console.log('[sync-refunds] Completed:', JSON.stringify(summary));

        return NextResponse.json(summary);

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('[sync-refunds] Error:', errorMessage);
        return NextResponse.json({
            error: errorMessage
        }, { status: 500 });
    }
}
