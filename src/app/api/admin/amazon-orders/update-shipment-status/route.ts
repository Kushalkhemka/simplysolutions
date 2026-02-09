import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VALID_STATUSES = ['PENDING', 'SHIPPED', 'DELIVERED'] as const;
type ShipmentStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, shipmentStatus } = body as { orderId?: string; shipmentStatus?: string };

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json(
                { error: 'Order ID is required' },
                { status: 400 }
            );
        }

        if (!shipmentStatus || !VALID_STATUSES.includes(shipmentStatus as ShipmentStatus)) {
            return NextResponse.json(
                { error: `Invalid shipment status. Must be one of: ${VALID_STATUSES.join(', ')}` },
                { status: 400 }
            );
        }

        // Update the order's shipment status
        const { error: updateError } = await supabase
            .from('amazon_orders')
            .update({
                shipment_status: shipmentStatus,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) {
            console.error('Error updating shipment status:', updateError);
            return NextResponse.json(
                { error: 'Failed to update shipment status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: `Shipment status updated to ${shipmentStatus}`
        });

    } catch (error) {
        console.error('Shipment status update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
