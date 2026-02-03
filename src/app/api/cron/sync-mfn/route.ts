/**
 * Cron endpoint to sync MFN (Merchant Fulfilled) orders
 * Schedule: Every 15 minutes
 * 
 * Features:
 * - Supports multiple seller accounts (stored in database)
 * - Uses ASIN mapping to get FSN for product identification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    getActiveSellerAccounts,
    updateSyncStatus,
    SellerAccountWithCredentials
} from '@/lib/amazon/seller-accounts';

// India marketplace (A21TJRUUN4KGV) uses the EU region endpoint
const SP_API_ENDPOINT = 'https://sellingpartnerapi-eu.amazon.com';

// Verify cron secret
function verifyCronAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true;
    return authHeader === `Bearer ${cronSecret}`;
}

async function getAccessToken(account: SellerAccountWithCredentials): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: account.refreshToken,
            client_id: account.clientId,
            client_secret: account.clientSecret
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchMFNOrders(accessToken: string, marketplaceId: string, createdAfter: string): Promise<any[]> {
    const allOrders: any[] = [];
    let nextToken: string | null = null;

    do {
        const url = new URL(`${SP_API_ENDPOINT}/orders/v0/orders`);
        url.searchParams.set('MarketplaceIds', marketplaceId);
        url.searchParams.set('CreatedAfter', createdAfter);
        url.searchParams.set('FulfillmentChannels', 'MFN');
        url.searchParams.set('MaxResultsPerPage', '100');

        if (nextToken) {
            url.searchParams.set('NextToken', nextToken);
        }

        const response = await fetch(url.toString(), {
            headers: { 'x-amz-access-token': accessToken }
        });

        if (!response.ok) {
            throw new Error(`SP-API error: ${response.status}`);
        }

        const data = await response.json();
        const orders = data.payload?.Orders || [];
        allOrders.push(...orders);

        nextToken = data.payload?.NextToken || null;

        // Rate limiting - small delay between pages
        if (nextToken) {
            await new Promise(resolve => setTimeout(resolve, 200));
        }
    } while (nextToken);

    return allOrders;
}

async function fetchOrderItems(accessToken: string, orderId: string): Promise<any[]> {
    // Add rate limiting delay to prevent throttling
    await new Promise(resolve => setTimeout(resolve, 100));

    const url = `${SP_API_ENDPOINT}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    if (!response.ok) {
        console.error(`Failed to fetch order items for ${orderId}: ${response.status}`);
        return [];
    }
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

async function syncMFNOrdersForAccount(
    account: SellerAccountWithCredentials,
    supabase: any,
    asinToFSN: Map<string, string>
): Promise<{ inserted: number; unmappedAsins: string[]; error?: string }> {
    try {
        const accessToken = await getAccessToken(account);

        // Fetch MFN orders from last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const orders = await fetchMFNOrders(accessToken, account.marketplaceId, twoDaysAgo.toISOString());

        if (orders.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, unmappedAsins: [] };
        }

        // Check existing orders - get those with null FSN so we can update them
        const orderIds = orders.map((o: any) => o.AmazonOrderId);
        const { data: existingOrders } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn')
            .in('order_id', orderIds);

        // Create a map of existing orders with their FSN status
        const existingOrdersMap = new Map((existingOrders || []).map((o: any) => [o.order_id, o.fsn]));

        // Process orders that are new OR have null FSN (need FSN update)
        const ordersToProcess = orders.filter((o: any) => {
            const existingFsn = existingOrdersMap.get(o.AmazonOrderId);
            return existingFsn === undefined || existingFsn === null;
        });

        if (ordersToProcess.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, unmappedAsins: [] };
        }

        // Prepare orders with ALL fields
        const ordersToInsert = [];
        const seenOrderIds = new Set<string>();
        const unmappedAsins = new Set<string>();

        for (const order of ordersToProcess) {
            // Skip duplicates within the same batch
            if (seenOrderIds.has(order.AmazonOrderId)) {
                continue;
            }
            seenOrderIds.add(order.AmazonOrderId);

            const items = await fetchOrderItems(accessToken, order.AmazonOrderId);
            const firstItem = items[0];
            const asin = firstItem?.ASIN;
            const sellerSku = firstItem?.SellerSKU;

            // Use ASIN mapping to get FSN
            const mappedFSN = asin ? asinToFSN.get(asin) : null;

            // Track unmapped ASINs for debugging
            if (asin && !mappedFSN) {
                unmappedAsins.add(asin);
            }

            ordersToInsert.push({
                order_id: order.AmazonOrderId,
                fulfillment_type: 'amazon_mfn',
                fsn: mappedFSN || sellerSku || null,
                order_date: order.PurchaseDate || null,
                order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                currency: order.OrderTotal?.CurrencyCode || 'INR',
                quantity: firstItem?.QuantityOrdered || 1,
                buyer_email: order.BuyerInfo?.BuyerEmail || null,
                contact_email: order.BuyerInfo?.BuyerEmail || null,
                city: order.ShippingAddress?.City || null,
                state: order.ShippingAddress?.StateOrRegion || null,
                postal_code: order.ShippingAddress?.PostalCode || null,
                country: order.ShippingAddress?.CountryCode || 'IN',
                warranty_status: 'PENDING',
                synced_at: new Date().toISOString(),
                seller_account_id: account.id  // Link to seller account
            });
        }

        // Use upsert to handle race conditions and update existing orders
        const { error } = await supabase
            .from('amazon_orders')
            .upsert(ordersToInsert, { onConflict: 'order_id' });

        if (error) {
            await updateSyncStatus(account.id, `Error: ${error.message}`);
            return { inserted: 0, unmappedAsins: Array.from(unmappedAsins), error: error.message };
        }

        await updateSyncStatus(account.id, 'success', ordersToInsert.length);
        return { inserted: ordersToInsert.length, unmappedAsins: Array.from(unmappedAsins) };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateSyncStatus(account.id, `Error: ${errorMessage}`);
        return { inserted: 0, unmappedAsins: [], error: errorMessage };
    }
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    try {
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
                totalOrdersInserted: 0,
                duration: `${Date.now() - startTime}ms`
            });
        }

        // Fetch ASIN mapping for FSN lookup (shared across all accounts)
        const { data: asinMappings } = await supabase
            .from('amazon_asin_mapping')
            .select('asin, fsn');

        const asinToFSN = new Map<string, string>();
        (asinMappings || []).forEach((m: any) => {
            asinToFSN.set(m.asin, m.fsn);
        });

        // Process each seller account
        const results: { accountName: string; inserted: number; unmappedAsins: string[]; error?: string }[] = [];
        let totalInserted = 0;
        const allUnmappedAsins = new Set<string>();

        for (const account of accounts) {
            console.log(`[sync-mfn] Processing account: ${account.name} (${account.merchantToken})`);

            const result = await syncMFNOrdersForAccount(account, supabase, asinToFSN);

            results.push({
                accountName: account.name,
                inserted: result.inserted,
                unmappedAsins: result.unmappedAsins,
                error: result.error
            });

            totalInserted += result.inserted;
            result.unmappedAsins.forEach(asin => allUnmappedAsins.add(asin));

            // Small delay between accounts to avoid rate limiting
            if (accounts.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json({
            success: true,
            message: 'MFN orders synced successfully',
            accountsProcessed: accounts.length,
            totalOrdersInserted: totalInserted,
            unmappedAsinCount: allUnmappedAsins.size,
            unmappedAsins: Array.from(allUnmappedAsins),
            results,
            duration: `${Date.now() - startTime}ms`
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({
            success: false,
            error: errorMessage,
            duration: `${Date.now() - startTime}ms`
        }, { status: 500 });
    }
}
