import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const VALID_STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'] as const;
type ValidStatus = typeof VALID_STATUSES[number];

export async function POST(request: NextRequest) {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Order ID and status are required' }, { status: 400 });
        }

        // Validate status
        if (!VALID_STATUSES.includes(status as ValidStatus)) {
            return NextResponse.json({
                error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`
            }, { status: 400 });
        }

        // Update order status
        const { data, error } = await supabase
            .from('amazon_orders')
            .update({
                warranty_status: status,
                updated_at: new Date().toISOString()
            })
            .eq('order_id', orderId)
            .select()
            .single();

        if (error) {
            console.error('Error updating order status:', error);
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: `Order status updated to ${status}`,
            order: data
        });

    } catch (error) {
        console.error('Error in update-status API:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

