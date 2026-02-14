import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const { orderId } = await request.json();

        if (!orderId || !orderId.trim()) {
            return NextResponse.json(
                { valid: false, error: 'Order ID is required' },
                { status: 400 }
            );
        }

        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('order_id')
            .eq('order_id', orderId.trim())
            .single();

        if (orderError || !order) {
            return NextResponse.json({
                valid: false,
                error: '⚠️ This Order ID does not belong to SimplySolutions. This product was sold by a FAKE SELLER / our competitor who sells fake pirated copies and makes their listing identical to ours to mislead customers. There is NO warranty for this order. We strongly recommend you REQUEST A REFUND immediately and give a 1-STAR RATING to warn other buyers. You have been scammed — we are sorry this happened to you.'
            }, { status: 404 });
        }

        return NextResponse.json({ valid: true });

    } catch (error) {
        console.error('Installation docs verify error:', error);
        return NextResponse.json(
            { valid: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
