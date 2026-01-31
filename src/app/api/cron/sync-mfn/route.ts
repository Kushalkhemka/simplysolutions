/**
 * Cron endpoint to sync MFN (Merchant Fulfilled) orders
 * Schedule: Every 15 minutes
 * Uses ASIN mapping to get FSN for product identification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SP_API_CONFIG = {
    clientId: process.env.AMAZON_SP_CLIENT_ID!,
    clientSecret: process.env.AMAZON_SP_CLIENT_SECRET!,
    refreshToken: process.env.AMAZON_SP_REFRESH_TOKEN!,
    marketplaceId: process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV',
    endpoint: 'https://sellingpartnerapi-eu.amazon.com'
};

// Verify cron secret
function verifyCronAuth(request: NextRequest): boolean {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) return true;
    return authHeader === `Bearer ${cronSecret}`;
}

async function getAccessToken(): Promise<string> {
    const response = await fetch('https://api.amazon.com/auth/o2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: SP_API_CONFIG.refreshToken,
            client_id: SP_API_CONFIG.clientId,
            client_secret: SP_API_CONFIG.clientSecret
        })
    });

    if (!response.ok) {
        throw new Error('Failed to get access token');
    }

    const data = await response.json();
    return data.access_token;
}

async function fetchMFNOrders(accessToken: string, createdAfter: string): Promise<any[]> {
    const allOrders: any[] = [];
    let nextToken: string | null = null;

    do {
        const url = new URL(`${SP_API_CONFIG.endpoint}/orders/v0/orders`);
        url.searchParams.set('MarketplaceIds', SP_API_CONFIG.marketplaceId);
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
    const url = `${SP_API_CONFIG.endpoint}/orders/v0/orders/${orderId}/orderItems`;
    const response = await fetch(url, {
        headers: { 'x-amz-access-token': accessToken }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.payload?.OrderItems || [];
}

export async function GET(request: NextRequest) {
    if (!verifyCronAuth(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const startTime = Date.now();

    try {
        if (!SP_API_CONFIG.clientId || !SP_API_CONFIG.refreshToken) {
            return NextResponse.json({ error: 'Missing SP-API credentials' }, { status: 500 });
        }

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const accessToken = await getAccessToken();

        // Fetch MFN orders from last 2 days
        const twoDaysAgo = new Date();
        twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

        const orders = await fetchMFNOrders(accessToken, twoDaysAgo.toISOString());

        if (orders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No MFN orders found',
                ordersFound: 0,
                ordersInserted: 0,
                duration: `${Date.now() - startTime}ms`
            });
        }

        // Check existing orders
        const orderIds = orders.map((o: any) => o.AmazonOrderId);
        const { data: existingOrders } = await supabase
            .from('amazon_orders')
            .select('order_id')
            .in('order_id', orderIds);

        const existingSet = new Set((existingOrders || []).map((o: any) => o.order_id));
        const newOrders = orders.filter((o: any) => !existingSet.has(o.AmazonOrderId));

        if (newOrders.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'All orders already synced',
                ordersFound: orders.length,
                ordersInserted: 0,
                duration: `${Date.now() - startTime}ms`
            });
        }

        // Fetch ASIN mapping for FSN lookup
        const { data: asinMappings } = await supabase
            .from('amazon_asin_mapping')
            .select('asin, fsn');

        const asinToFSN = new Map<string, string>();
        (asinMappings || []).forEach((m: any) => {
            asinToFSN.set(m.asin, m.fsn);
        });

        // Prepare orders with ALL fields
        const ordersToInsert = [];
        const seenOrderIds = new Set<string>();

        for (const order of newOrders) {
            // Skip duplicates within the same batch
            if (seenOrderIds.has(order.AmazonOrderId)) {
                continue;
            }
            seenOrderIds.add(order.AmazonOrderId);

            const items = await fetchOrderItems(accessToken, order.AmazonOrderId);
            const firstItem = items[0];
            const asin = firstItem?.ASIN;

            // Use ASIN mapping to get FSN
            const mappedFSN = asin ? asinToFSN.get(asin) : null;

            ordersToInsert.push({
                order_id: order.AmazonOrderId,
                fulfillment_type: 'amazon_mfn',
                // Use FSN from ASIN mapping, fallback to SellerSKU only if no mapping exists
                fsn: mappedFSN || firstItem?.SellerSKU || null,
                // Order details
                order_date: order.PurchaseDate || null,
                order_total: order.OrderTotal?.Amount ? parseFloat(order.OrderTotal.Amount) : null,
                currency: order.OrderTotal?.CurrencyCode || 'INR',
                quantity: firstItem?.QuantityOrdered || 1,
                // Buyer info
                buyer_email: order.BuyerInfo?.BuyerEmail || null,
                contact_email: order.BuyerInfo?.BuyerEmail || null,
                // Shipping address
                city: order.ShippingAddress?.City || null,
                state: order.ShippingAddress?.StateOrRegion || null,
                postal_code: order.ShippingAddress?.PostalCode || null,
                country: order.ShippingAddress?.CountryCode || 'IN',
                // Status
                warranty_status: 'PENDING',
                synced_at: new Date().toISOString()
            });
        }

        // Use upsert to handle race conditions - if order already exists, just update synced_at
        const { error } = await supabase
            .from('amazon_orders')
            .upsert(ordersToInsert, {
                onConflict: 'order_id',
                ignoreDuplicates: true  // Skip updates for existing records
            });

        if (error) {
            return NextResponse.json({
                success: false,
                error: error.message,
                duration: `${Date.now() - startTime}ms`
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'MFN orders synced successfully',
            ordersFound: orders.length,
            ordersInserted: ordersToInsert.length,
            duration: `${Date.now() - startTime}ms`
        });

    } catch (error: any) {
        return NextResponse.json({
            success: false,
            error: error.message,
            duration: `${Date.now() - startTime}ms`
        }, { status: 500 });
    }
}
