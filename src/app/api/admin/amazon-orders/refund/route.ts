/**
 * Admin API for managing order refund status
 * POST /api/admin/amazon-orders/refund - Toggle refund status for an order
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, isRefunded } = body;

        // Validate inputs
        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        if (typeof isRefunded !== 'boolean') {
            return NextResponse.json({ error: 'isRefunded must be a boolean' }, { status: 400 });
        }

        // Update the order's refund status
        const { data, error } = await supabase
            .from('amazon_orders')
            .update({
                is_refunded: isRefunded,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating refund status:', error);
            return NextResponse.json({ error: 'Order not found or update failed' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            order: data,
            message: isRefunded ? 'Order marked as refunded' : 'Refund status removed'
        });

    } catch (error: any) {
        console.error('Refund status update error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}

// GET - Check refund status for an order
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('amazon_orders')
            .select('order_id, is_refunded, fulfillment_status')
            .eq('order_id', orderId)
            .single();

        if (error || !data) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        return NextResponse.json({
            orderId: data.order_id,
            isRefunded: data.is_refunded || false,
            fulfillmentStatus: data.fulfillment_status
        });

    } catch (error: any) {
        console.error('Get refund status error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
