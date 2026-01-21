import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, secretCode, fsn, licenseKeyId } = body;

        // Validate inputs
        if (!orderId && !secretCode) {
            return NextResponse.json({ error: 'Please provide either Order ID or Secret Code' }, { status: 400 });
        }

        if (!fsn) {
            return NextResponse.json({ error: 'Product FSN is required' }, { status: 400 });
        }

        const identifier = orderId || secretCode;

        // Check if order already exists
        const { data: existing } = await supabase
            .from('amazon_orders')
            .select('id')
            .eq('order_id', identifier)
            .single();

        if (existing) {
            return NextResponse.json({ error: 'Order already exists in the system' }, { status: 409 });
        }

        // Create the order
        const orderData: any = {
            order_id: identifier,
            fsn: fsn,
            fulfillment_type: secretCode ? 'amazon_digital' : 'amazon_fba',
            warranty_status: 'PENDING',
        };

        // If a key is selected, link it
        if (licenseKeyId) {
            orderData.license_key_id = licenseKeyId;

            // Mark the key as redeemed
            await supabase
                .from('amazon_activation_license_keys')
                .update({
                    is_redeemed: true,
                    order_id: identifier,
                })
                .eq('id', licenseKeyId);
        }

        const { data, error } = await supabase
            .from('amazon_orders')
            .insert(orderData)
            .select()
            .single();

        if (error) {
            console.error('Error creating order:', error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, order: data });

    } catch (error: any) {
        console.error('Manual order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
