/**
 * Cron endpoint to sync FBA (Amazon Fulfilled) orders
 * Schedule: Every 15 minutes (configurable in Vercel/deployment)
 * 
 * Features:
 * - Syncs new FBA orders from Amazon SP-API
 * - Supports multiple seller accounts (stored in database)
 * - Updates existing orders when fulfillment status changes
 * - Stores synced_at timestamp for activation delay calculation
 * - Uses ASIN mapping to get FSN for product identification
 * 
 * NOTE: This is for FBA (AFN) orders only. MFN orders use sync-mfn endpoint.
 * NOTE: Redeemable date is calculated dynamically at activation time, not here.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    getActiveSellerAccounts,
    updateSyncStatus,
    SellerAccountWithCredentials
} from '@/lib/amazon/seller-accounts';

const SP_API_ENDPOINT = 'https://sellingpartnerapi-fe.amazon.com';

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

async function fetchFBAOrders(accessToken: string, marketplaceId: string, createdAfter: string): Promise<any[]> {
    const allOrders: any[] = [];
    let nextToken: string | null = null;

    do {
        const url = new URL(`${SP_API_ENDPOINT}/orders/v0/orders`);
        url.searchParams.set('MarketplaceIds', marketplaceId);
        url.searchParams.set('CreatedAfter', createdAfter);
        url.searchParams.set('FulfillmentChannels', 'AFN');
        url.searchParams.set('MaxResultsPerPage', '100');

        if (nextToken) {
            url.searchParams.set('NextToken', nextToken);
        }

        const response = await fetch(url.toString(), {
            headers: { 'x-amz-access-token': accessToken }
        });

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[sync-fba] SP-API error: ${response.status} - ${errorBody}`);
            throw new Error(`SP-API error: ${response.status} - ${errorBody.substring(0, 200)}`);
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
    const url = `${SP_API_ENDPOINT}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

async function syncOrdersForAccount(
    account: SellerAccountWithCredentials,
    supabase: any,
    asinToFSN: Map<string, string>
): Promise<{ inserted: number; updated: number; error?: string }> {
    try {
        const accessToken = await getAccessToken(account);

        // Fetch FBA orders from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const orders = await fetchFBAOrders(accessToken, account.marketplaceId, thirtyDaysAgo.toISOString());

        if (orders.length === 0) {
            await updateSyncStatus(account.id, 'success', 0);
            return { inserted: 0, updated: 0 };
        }

        // Check existing orders with their current fulfillment status
        const orderIds = orders.map((o: any) => o.AmazonOrderId);
        const { data: existingOrders } = await supabase
            .from('amazon_orders')
            .select('order_id, fulfillment_status, shipped_at, state')
            .in('order_id', orderIds);

        const existingMap = new Map<string, { order_id: string; fulfillment_status: string | null; shipped_at: string | null; state: string | null }>();
        (existingOrders || []).forEach((o: any) => {
            existingMap.set(o.order_id, o);
        });

        // Separate new orders from existing orders that need status updates
        const newOrders = orders.filter((o: any) => !existingMap.has(o.AmazonOrderId));
        const ordersToUpdate = orders.filter((o: any) => {
            const existing = existingMap.get(o.AmazonOrderId);
            if (!existing) return false;

            const statusChanged = (existing.fulfillment_status === 'Pending' || existing.fulfillment_status === null)
                && o.OrderStatus !== 'Pending';
            const needsShippedAt = o.OrderStatus === 'Shipped' && !existing.shipped_at;
            const needsState = !existing.state && o.ShippingAddress?.StateOrRegion;

            return statusChanged || needsShippedAt || needsState;
        });

        // Prepare new orders for insert
        const ordersToInsert = [];
        const multiProductOrders = [];

        for (const order of newOrders) {
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
                    fulfillment_type: 'amazon_fba',
                    status: 'PENDING'
                });
            }

            // Only sync first item to amazon_orders (customer can activate this)
            const firstItem = items[0];
            const asin = firstItem?.ASIN;
            const mappedFSN = asin ? asinToFSN.get(asin) : null;

            const amazonOrderStatus = order.OrderStatus || 'Pending';
            const postalCode = order.ShippingAddress?.PostalCode || null;
            const state = order.ShippingAddress?.StateOrRegion || null;

            // Calculate shipped_at if order is already shipped
            let shippedAt = null;
            if (amazonOrderStatus === 'Shipped') {
                shippedAt = order.LastUpdateDate || new Date().toISOString();
            }

            ordersToInsert.push({
                order_id: order.AmazonOrderId,
                fulfillment_type: 'amazon_fba',
                fulfillment_status: amazonOrderStatus,
                fsn: mappedFSN || firstItem?.SellerSKU || null,
                order_date: order.PurchaseDate || null,
                order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                currency: order.OrderTotal?.CurrencyCode || 'INR',
                quantity: firstItem?.QuantityOrdered || 1,
                buyer_email: order.BuyerInfo?.BuyerEmail || null,
                contact_email: order.BuyerInfo?.BuyerEmail || null,
                city: order.ShippingAddress?.City || null,
                state: state,
                postal_code: postalCode,
                country: order.ShippingAddress?.CountryCode || 'IN',
                warranty_status: 'PENDING',
                shipped_at: shippedAt,
                synced_at: new Date().toISOString(),
                seller_account_id: account.id  // Link to seller account
            });
        }

        // Insert new orders
        let insertError = null;
        if (ordersToInsert.length > 0) {
            const { error } = await supabase.from('amazon_orders').insert(ordersToInsert);
            insertError = error;
        }

        // Log multi-product orders for admin
        if (multiProductOrders.length > 0) {
            await supabase.from('multi_fsn_orders').insert(multiProductOrders);
        }

        // Update existing orders that changed status (Pending -> Shipped/Canceled)
        let ordersUpdated = 0;
        for (const order of ordersToUpdate) {
            const amazonOrderStatus = order.OrderStatus;
            const postalCode = order.ShippingAddress?.PostalCode || null;
            const state = order.ShippingAddress?.StateOrRegion || null;

            let shippedAt = null;
            if (amazonOrderStatus === 'Shipped') {
                shippedAt = order.LastUpdateDate || new Date().toISOString();
            }

            const updateData: Record<string, unknown> = {
                fulfillment_status: amazonOrderStatus,
                updated_at: new Date().toISOString()
            };

            if (order.ShippingAddress) {
                updateData.city = order.ShippingAddress.City || null;
                updateData.state = state;
                updateData.postal_code = postalCode;
                updateData.country = order.ShippingAddress.CountryCode || 'IN';
            }

            if (shippedAt) {
                updateData.shipped_at = shippedAt;
            }

            if (order.BuyerInfo?.BuyerEmail) {
                updateData.buyer_email = order.BuyerInfo.BuyerEmail;
                updateData.contact_email = order.BuyerInfo.BuyerEmail;
            }

            if (order.OrderTotal?.Amount) {
                updateData.order_total = parseFloat(order.OrderTotal.Amount);
                updateData.currency = order.OrderTotal.CurrencyCode || 'INR';
            }

            const { error: updateError } = await supabase
                .from('amazon_orders')
                .update(updateData)
                .eq('order_id', order.AmazonOrderId);

            if (!updateError) {
                ordersUpdated++;
            }
        }

        if (insertError) {
            await updateSyncStatus(account.id, `Error: ${insertError.message}`);
            return { inserted: 0, updated: 0, error: insertError.message };
        }

        await updateSyncStatus(account.id, 'success', ordersToInsert.length);
        return { inserted: ordersToInsert.length, updated: ordersUpdated };

    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        await updateSyncStatus(account.id, `Error: ${errorMessage}`);
        return { inserted: 0, updated: 0, error: errorMessage };
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
                totalOrdersUpdated: 0,
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
        const results: { accountName: string; inserted: number; updated: number; error?: string }[] = [];
        let totalInserted = 0;
        let totalUpdated = 0;

        for (const account of accounts) {
            console.log(`[sync-fba] Processing account: ${account.name} (${account.merchantToken})`);

            const result = await syncOrdersForAccount(account, supabase, asinToFSN);

            results.push({
                accountName: account.name,
                inserted: result.inserted,
                updated: result.updated,
                error: result.error
            });

            totalInserted += result.inserted;
            totalUpdated += result.updated;

            // Small delay between accounts to avoid rate limiting
            if (accounts.length > 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        return NextResponse.json({
            success: true,
            message: 'FBA orders synced successfully',
            accountsProcessed: accounts.length,
            totalOrdersInserted: totalInserted,
            totalOrdersUpdated: totalUpdated,
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
