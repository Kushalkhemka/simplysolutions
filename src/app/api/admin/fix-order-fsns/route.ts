import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// POST /api/admin/fix-order-fsns - Fix FSNs in amazon_orders that are using SKUs instead
export async function POST() {
    try {
        const adminClient = getAdminClient();

        // Get all amazon_orders with their current FSN
        const { data: amazonOrders, error: ordersError } = await adminClient
            .from('amazon_orders')
            .select('id, order_id, fsn');

        if (ordersError) {
            return errorResponse('Failed to fetch amazon orders: ' + ordersError.message, 500);
        }

        // Get all products with SKU → FSN mapping
        const { data: products, error: productsError } = await adminClient
            .from('products')
            .select('sku, fsn')
            .not('fsn', 'is', null);

        if (productsError) {
            return errorResponse('Failed to fetch products: ' + productsError.message, 500);
        }

        // Create SKU → FSN map
        const skuToFsnMap: Record<string, string> = {};
        products?.forEach(p => {
            skuToFsnMap[p.sku] = p.fsn;
        });

        const fixed = [];
        const skipped = [];

        // Update orders where FSN looks like a SKU (starts with OFF_)
        for (const order of amazonOrders || []) {
            if (order.fsn && order.fsn.startsWith('OFF_')) {
                const correctFsn = skuToFsnMap[order.fsn];
                if (correctFsn) {
                    // Update the FSN
                    const { error: updateError } = await adminClient
                        .from('amazon_orders')
                        .update({ fsn: correctFsn })
                        .eq('id', order.id);

                    if (updateError) {
                        console.error(`Failed to update order ${order.order_id}:`, updateError);
                        skipped.push({
                            orderId: order.order_id,
                            oldFsn: order.fsn,
                            error: updateError.message
                        });
                    } else {
                        fixed.push({
                            orderId: order.order_id,
                            oldFsn: order.fsn,
                            newFsn: correctFsn
                        });
                    }
                } else {
                    skipped.push({
                        orderId: order.order_id,
                        oldFsn: order.fsn,
                        reason: 'No FSN mapping found'
                    });
                }
            }
        }

        return successResponse({
            totalOrders: amazonOrders?.length || 0,
            fixed: fixed.length,
            skipped: skipped.length,
            fixedOrders: fixed,
            skippedOrders: skipped
        });

    } catch (error) {
        console.error('Fix order FSNs error:', error);
        return errorResponse('Internal server error: ' + (error as Error).message, 500);
    }
}
