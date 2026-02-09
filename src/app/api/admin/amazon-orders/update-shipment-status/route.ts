import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VALID_STATUSES = ['Pending', 'Shipped', 'Delivered'] as const;
type FulfillmentStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, fulfillmentStatus } = body as { orderId?: string; fulfillmentStatus?: string };

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        if (!fulfillmentStatus || !VALID_STATUSES.includes(fulfillmentStatus as FulfillmentStatus)) {
            return NextResponse.json(
                { error: `Invalid fulfillment status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        // Update the order's fulfillment status
        const updateData: any = {
            fulfillment_status: fulfillmentStatus,
            updated_at: new Date().toISOString()
        };

        // If marking as Shipped, also set shipped_at timestamp
        if (fulfillmentStatus === 'Shipped') {
            updateData.shipped_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('amazon_orders')
            .update(updateData)
            .eq('order_id', orderId);

        if (updateError) {
            console.error('Error updating fulfillment status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update fulfillment status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Fulfillment status updated to ${fulfillmentStatus}`
        });

    } catch (error) {
        console.error('Fulfillment status update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
