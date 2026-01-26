import { NextRequest } from 'next/server';
import { getAdminClient } from '@/lib/supabase/admin';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

// GET - Debug key status for a specific order
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return errorResponse('orderId is required', 400);
        }

        const adminClient = getAdminClient();

        // Get keys assigned to this order
        const { data: keys, error } = await adminClient
            .from('amazon_activation_license_keys')
            .select('id, license_key, fsn, is_redeemed, order_id, redeemed_at')
            .eq('order_id', orderId);

        if (error) {
            return errorResponse('Failed to fetch keys: ' + error.message, 500);
        }

        // Get total counts
        const { count: available } = await adminClient
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('is_redeemed', false);

        const { count: redeemed } = await adminClient
            .from('amazon_activation_license_keys')
            .select('*', { count: 'exact', head: true })
            .eq('is_redeemed', true);

        return successResponse({
            orderId,
            keysForOrder: keys,
            totalAvailable: available,
            totalRedeemed: redeemed
        });

    } catch (error) {
        return errorResponse('Internal server error: ' + (error as Error).message, 500);
    }
}
