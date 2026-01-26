import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// POST /api/admin/backfill-secret-codes - Backfill secret_codes for existing orders
export async function POST(request: NextRequest) {
    try {
        const adminClient = getAdminClient();
        const body = await request.json();
        const { orderId } = body;

        if (!orderId) {
            return errorResponse('orderId is required', 400);
        }

        // Get the order to verify it exists
        const { data: order, error: orderError } = await adminClient
            .from('orders')
            .select('id, order_number, billing_email')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return errorResponse('Order not found', 404);
        }

        // Get all order items for this order
        const { data: orderItems, error: itemsError } = await adminClient
            .from('order_items')
            .select('id, product_id, product_sku, quantity, secret_codes')
            .eq('order_id', orderId);

        if (itemsError || !orderItems) {
            return errorResponse('Failed to fetch order items', 500);
        }

        const results = [];

        for (const item of orderItems) {
            // Skip if already has secret_codes
            if (item.secret_codes && item.secret_codes.length > 0) {
                results.push({
                    itemId: item.id,
                    status: 'skipped',
                    reason: 'Already has secret_codes',
                    codes: item.secret_codes
                });
                continue;
            }

            // Get FSN from product
            const { data: product } = await adminClient
                .from('products')
                .select('fsn')
                .eq('id', item.product_id)
                .single();

            const fsn = product?.fsn || item.product_sku || 'UNKNOWN';

            // Find existing amazon_orders entries for this email and FSN
            const { data: amazonOrders } = await adminClient
                .from('amazon_orders')
                .select('order_id, fsn, quantity, created_at')
                .eq('contact_email', order.billing_email)
                .eq('fsn', fsn)
                .order('created_at', { ascending: false })
                .limit(item.quantity);

            if (amazonOrders && amazonOrders.length > 0) {
                const secretCodes = amazonOrders.map(ao => ao.order_id);

                // Update order_item with secret_codes
                const { error: updateError } = await adminClient
                    .from('order_items')
                    .update({
                        secret_codes: secretCodes,
                        product_fsn: fsn
                    })
                    .eq('id', item.id);

                if (updateError) {
                    results.push({
                        itemId: item.id,
                        status: 'error',
                        error: updateError.message
                    });
                } else {
                    results.push({
                        itemId: item.id,
                        status: 'success',
                        fsn: fsn,
                        codesFound: secretCodes.length,
                        codes: secretCodes
                    });
                }
            } else {
                // No amazon_orders found, try matching by order_number pattern
                // Look for amazon_orders created around the same time as the order
                const { data: recentAmazonOrders } = await adminClient
                    .from('amazon_orders')
                    .select('order_id, fsn, quantity, created_at')
                    .eq('contact_email', order.billing_email)
                    .order('created_at', { ascending: false })
                    .limit(20);

                results.push({
                    itemId: item.id,
                    status: 'not_found',
                    fsn: fsn,
                    productSku: item.product_sku,
                    availableAmazonOrders: recentAmazonOrders?.map(ao => ({
                        code: ao.order_id,
                        fsn: ao.fsn
                    })) || []
                });
            }
        }

        return successResponse({
            orderId: order.id,
            orderNumber: order.order_number,
            results
        });

    } catch (error) {
        console.error('Backfill error:', error);
        return errorResponse('Internal server error', 500);
    }
}
