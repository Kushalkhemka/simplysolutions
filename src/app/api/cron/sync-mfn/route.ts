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
import { isComboProduct } from '@/lib/amazon/combo-products';
import { logCronStart, logCronSuccess, logCronError } from '@/lib/cron/logger';

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
): Promise<{ inserted: number; multiProductCount: number; unmappedAsins: string[]; error?: string }> {
    try {
        const accessToken = await getAccessToken(account);

        // Fetch MFN orders from last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 1);

        const orders = await fetchMFNOrders(accessToken, account.marketplaceId, twoDaysAgo.toISOString());

        if (orders.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, multiProductCount: 0, unmappedAsins: [] };
        }

        // Check existing orders - get order_id + fsn pairs
        const orderIds = orders.map((o: any) => o.AmazonOrderId);
        const { data: existingOrders } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn')
            .in('order_id', orderIds);

        // Create a set of existing order_id:fsn combinations
        const existingPairs = new Set(
            (existingOrders || []).map((o: any) => `${o.order_id}:${o.fsn || ''}`)
        );
        // Also track which order_ids exist at all (for null FSN update check)
        const existingOrderIds = new Set((existingOrders || []).map((o: any) => o.order_id));

        // Only process orders that are new or have items not yet in the DB
        const ordersToProcess = orders.filter((o: any) => {
            // Process if the order doesn't exist at all, or if it has null FSN entries
            if (!existingOrderIds.has(o.AmazonOrderId)) return true;
            // Also re-process if there are null FSN entries (need FSN update)
            const hasNullFsn = (existingOrders || []).some(
                (e: any) => e.order_id === o.AmazonOrderId && !e.fsn
            );
            return hasNullFsn;
        });

        if (ordersToProcess.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, multiProductCount: 0, unmappedAsins: [] };
        }

        // Prepare orders with ALL fields — one row per item
        const ordersToInsert = [];
        const multiProductOrders = [];
        const seenOrderIds = new Set<string>();
        const unmappedAsins = new Set<string>();

        for (const order of ordersToProcess) {
            // Skip duplicates within the same batch
            if (seenOrderIds.has(order.AmazonOrderId)) {
                continue;
            }
            seenOrderIds.add(order.AmazonOrderId);

            const items = await fetchOrderItems(accessToken, order.AmazonOrderId);

            // Log multi-product orders for manual admin handling
            if (items.length > 1) {
                const itemsData = items.map((item: any) => ({
                    asin: item.ASIN,
                    sku: item.SellerSKU,
                    fsn: asinToFSN.get(item.ASIN) || item.SellerSKU,
                    title: item.Title,
                    quantity: item.QuantityOrdered,
                    price: item.ItemPrice?.Amount
                }));

                multiProductOrders.push({
                    order_id: order.AmazonOrderId,
                    order_date: order.PurchaseDate || null,
                    buyer_email: order.BuyerInfo?.BuyerEmail || null,
                    contact_email: order.BuyerInfo?.BuyerEmail || null,
                    items: itemsData,
                    item_count: items.length,
                    total_amount: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                    currency: order.OrderTotal?.CurrencyCode || 'INR',
                    fulfillment_type: 'amazon_mfn',
                    status: 'PENDING'
                });

                console.log(`[sync-mfn] Multi-product order detected: ${order.AmazonOrderId} (${items.length} items)`);
            }

            // Insert one row per item (not just the first)
            for (const item of items) {
                const asin = item.ASIN;
                const sellerSku = item.SellerSKU;
                const mappedFSN = asin ? asinToFSN.get(asin) : null;

                // Track unmapped ASINs for debugging
                if (asin && !mappedFSN) {
                    unmappedAsins.add(asin);
                }

                const finalFsn = mappedFSN || sellerSku || null;
                const qty = item.QuantityOrdered || 1;

                // Skip if this order_id + fsn pair already exists
                if (finalFsn && existingPairs.has(`${order.AmazonOrderId}:${finalFsn}`)) {
                    continue;
                }

                ordersToInsert.push({
                    order_id: order.AmazonOrderId,
                    fulfillment_type: 'amazon_mfn',
                    fsn: finalFsn,
                    order_date: order.PurchaseDate || null,
                    order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                    currency: order.OrderTotal?.CurrencyCode || 'INR',
                    quantity: qty,
                    getcid_limit: qty * 2,
                    buyer_email: order.BuyerInfo?.BuyerEmail || null,
                    contact_email: order.BuyerInfo?.BuyerEmail || null,
                    city: order.ShippingAddress?.City || null,
                    state: order.ShippingAddress?.StateOrRegion || null,
                    postal_code: order.ShippingAddress?.PostalCode || null,
                    country: order.ShippingAddress?.CountryCode || 'IN',
                    warranty_status: 'PENDING',
                    synced_at: new Date().toISOString(),
                    seller_account_id: account.id
                });
            }
        }

        if (ordersToInsert.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, multiProductCount: multiProductOrders.length, unmappedAsins: Array.from(unmappedAsins) };
        }

        // Insert orders (use insert instead of upsert since we check for duplicates above)
        const { error } = await supabase
            .from('amazon_orders')
            .insert(ordersToInsert);

        if (error) {
            await updateSyncStatus(account.id, `Error: ${error.message}`);
            return { inserted: 0, multiProductCount: 0, unmappedAsins: Array.from(unmappedAsins), error: error.message };
        }

        // Log multi-product orders for admin handling
        if (multiProductOrders.length > 0) {
            const { error: multiError } = await supabase
                .from('multi_fsn_orders')
                .insert(multiProductOrders);

            if (multiError) {
                console.error(`[sync-mfn] Error inserting multi-product orders: ${multiError.message}`);
            } else {
                console.log(`[sync-mfn] Logged ${multiProductOrders.length} multi-product order(s) for admin review`);
            }
        }

        await updateSyncStatus(account.id, 'success', ordersToInsert.length);
        return { inserted: ordersToInsert.length, multiProductCount: multiProductOrders.length, unmappedAsins: Array.from(unmappedAsins) };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateSyncStatus(account.id, `Error: ${errorMessage}`);
        return { inserted: 0, multiProductCount: 0, unmappedAsins: [], error: errorMessage };
    }
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();
    const logId = await logCronStart('sync-mfn');

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
        const results: { accountName: string; inserted: number; multiProductCount: number; unmappedAsins: string[]; error?: string }[] = [];
        let totalInserted = 0;
        let totalMultiProduct = 0;
        const allUnmappedAsins = new Set<string>();

        for (const account of accounts) {
            console.log(`[sync-mfn] Processing account: ${account.name} (${account.merchantToken})`);

            const result = await syncMFNOrdersForAccount(account, supabase, asinToFSN);

            results.push({
                accountName: account.name,
                inserted: result.inserted,
                multiProductCount: result.multiProductCount,
                unmappedAsins: result.unmappedAsins,
                error: result.error
            });

            totalInserted += result.inserted;
            totalMultiProduct += result.multiProductCount;
            result.unmappedAsins.forEach(asin => allUnmappedAsins.add(asin));

            // Small delay between accounts to avoid rate limiting
            if (accounts.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        await logCronSuccess(logId, totalInserted, { results });

        return NextResponse.json({
            success: true,
            message: 'MFN orders synced successfully',
            accountsProcessed: accounts.length,
            totalOrdersInserted: totalInserted,
            totalMultiProductOrders: totalMultiProduct,
            unmappedAsinCount: allUnmappedAsins.size,
            unmappedAsins: Array.from(allUnmappedAsins),
            results,
            duration: `${Date.now() - startTime}ms`
        });

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await logCronError(logId, errorMessage);
        return NextResponse.json({
            success: false,
            error: errorMessage,
            duration: `${Date.now() - startTime}ms`
        }, { status: 500 });
    }
}
