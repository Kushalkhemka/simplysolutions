import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// POST /api/admin/fix-specific-order-fsn - Fix FSN for a specific order by secret code
export async function POST(request: NextRequest) {
    try {
        const { secretCode } = await request.json();

        if (!secretCode) {
            return errorResponse('Secret code is required', 400);
        }

        const adminClient = getAdminClient();

        // Get the order
        const { data: order, error: orderError } = await adminClient
            .from('amazon_orders')
            .select('id, order_id, fsn')
            .eq('order_id', secretCode)
            .single();

        if (orderError || !order) {
            return errorResponse('Order not found: ' + secretCode, 404);
        }

        // Get all products to find the correct FSN mapping
        const { data: products, error: productsError } = await adminClient
            .from('products')
            .select('sku, fsn')
            .not('fsn', 'is', null);

        if (productsError) {
            return errorResponse('Failed to fetch products: ' + productsError.message, 500);
        }

        // Check if current FSN is a SKU
        const currentFsn = order.fsn;
        const skuToFsnMap: Record<string, string> = {};
        products?.forEach(p => {
            skuToFsnMap[p.sku] = p.fsn;
        });

        let correctFsn = currentFsn;

        // If current FSN looks like a SKU (OFF_XX), map it
        if (currentFsn && currentFsn.startsWith('OFF_')) {
            correctFsn = skuToFsnMap[currentFsn] || currentFsn;
        }

        // Update the order
        const { error: updateError } = await adminClient
            .from('amazon_orders')
            .update({ fsn: correctFsn })
            .eq('id', order.id);

        if (updateError) {
            return errorResponse('Failed to update order: ' + updateError.message, 500);
        }

        return successResponse({
            orderId: secretCode,
            oldFsn: currentFsn,
            newFsn: correctFsn,
            updated: currentFsn !== correctFsn
        });

    } catch (error) {
        console.error('Fix specific order FSN error:', error);
        return errorResponse('Internal server error: ' + (error as Error).message, 500);
    }
}
