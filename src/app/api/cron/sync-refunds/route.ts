/**
 * Cron endpoint to sync refund status for all Amazon orders
 * 
 * EFFICIENT APPROACH: Fetches ALL refund transactions in date range (30 days)
 * instead of checking each order individually.
 * 
 * Schedule: Every 6 hours
 * Timeout: 15 minutes (900s on Vercel Enterprise, or use edge function)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Coolify hosting - can use longer timeouts
export const maxDuration = 900; // 15 minutes

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

interface RefundTransaction {
    orderId: string;
    refundDate: string;
    refundAmount: number;
    refundId: string;
}

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
        const url = new URL(`${SP_API_CONFIG.endpoint}/finances/2024-06-19/transactions`);
        url.searchParams.set('postedAfter', postedAfter.toISOString());

        if (nextToken) {
            url.searchParams.set('nextToken', nextToken);
        }

        console.log(`[sync-refunds] Fetching page ${pageCount + 1}...`);

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
                // Extract ORDER_ID from relatedIdentifiers
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

    console.log(`[sync-refunds] Fetched ${pageCount} pages, found ${refunds.length} refund transactions`);

    return refunds;
}

export async function GET(request: NextRequest) {
    try {
        // Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        console.log('[sync-refunds] Starting bulk refund sync...');

        // Get access token
        const accessToken = await getAccessToken();
        console.log('[sync-refunds] Access token obtained');

        // Calculate date range (60 days ago)
        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        // Fetch ALL refund transactions in date range (EFFICIENT!)
        const refundTransactions = await fetchAllRefundTransactions(accessToken, sixtyDaysAgo);

        if (refundTransactions.length === 0) {
            console.log('[sync-refunds] No refund transactions found');
            return NextResponse.json({
                success: true,
                message: 'No refund transactions found',
                refundsFound: 0,
                ordersUpdated: 0
            });
        }

        // Get unique order IDs
        const refundedOrderIds = [...new Set(refundTransactions.map(r => r.orderId))];
        console.log(`[sync-refunds] Found ${refundedOrderIds.length} unique orders with refunds`);

        // Check which orders exist in our database and are not already marked as refunded
        const { data: existingOrders, error: fetchError } = await supabase
            .from('amazon_orders')
            .select('order_id, is_refunded')
            .in('order_id', refundedOrderIds);

        if (fetchError) {
            console.error('[sync-refunds] Failed to fetch orders:', fetchError);
            throw new Error('Failed to fetch orders from database');
        }

        // Filter to orders that need updating (exist + not already refunded)
        const ordersToUpdate = existingOrders
            ?.filter(o => !o.is_refunded)
            .map(o => o.order_id) || [];

        console.log(`[sync-refunds] ${ordersToUpdate.length} orders need updating`);

        // Update refunded orders in database
        let updatedCount = 0;
        if (ordersToUpdate.length > 0) {
            const { error: updateError, count } = await supabase
                .from('amazon_orders')
                .update({
                    is_refunded: true,
                    updated_at: new Date().toISOString()
                })
                .in('order_id', ordersToUpdate);

            if (updateError) {
                console.error('[sync-refunds] Failed to update refund status:', updateError);
            } else {
                updatedCount = count || ordersToUpdate.length;
                console.log(`[sync-refunds] Marked ${updatedCount} orders as refunded`);
            }
        }

        // Log refund details
        const refundDetails = ordersToUpdate.map(orderId => {
            const refund = refundTransactions.find(r => r.orderId === orderId);
            return {
                orderId,
                refundDate: refund?.refundDate,
                amount: refund?.refundAmount
            };
        });

        const summary = {
            success: true,
            refundTransactionsFound: refundTransactions.length,
            uniqueOrdersWithRefunds: refundedOrderIds.length,
            ordersInDatabase: existingOrders?.length || 0,
            ordersUpdated: updatedCount,
            refundDetails: refundDetails.slice(0, 20) // Limit to first 20 for response size
        };

        console.log('[sync-refunds] Completed:', JSON.stringify(summary));

        return NextResponse.json(summary);

    } catch (error: any) {
        console.error('[sync-refunds] Error:', error);
        return NextResponse.json({
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
