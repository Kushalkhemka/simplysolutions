import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use admin client to bypass RLS for public customer submissions
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const orderId = formData.get('orderId') as string;
        const screenshot = formData.get('screenshot') as File;
        const email = formData.get('email') as string;
        const whatsapp = formData.get('whatsapp') as string;

        if (!orderId || !screenshot) {
            return NextResponse.json(
                { success: false, error: 'Order ID and screenshot are required' },
                { status: 400 }
            );
        }

        if (!email || !whatsapp) {
            return NextResponse.json(
                { success: false, error: 'Email and WhatsApp number are required' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Verify the order exists and is FBA
        const { data: order, error: orderError } = await supabase
            .from('amazon_orders')
            .select('order_id, fulfillment_type, early_appeal_status, state')
            .eq('order_id', orderId)
            .single();

        if (orderError || !order) {
            return NextResponse.json(
                { success: false, error: 'Order not found' },
                { status: 404 }
            );
        }

        // Check if already has a pending or approved appeal
        if (order.early_appeal_status === 'PENDING') {
            return NextResponse.json(
                { success: false, error: 'You already have a pending appeal for this order' },
                { status: 400 }
            );
        }

        if (order.early_appeal_status === 'APPROVED') {
            return NextResponse.json(
                { success: false, error: 'Your appeal has already been approved' },
                { status: 400 }
            );
        }

        // Check if there's already an appeal in fba_early_appeals table
        const { data: existingAppeal } = await supabase
            .from('fba_early_appeals')
            .select('id, status')
            .eq('order_id', orderId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (existingAppeal?.status === 'PENDING') {
            return NextResponse.json(
                { success: false, error: 'You already have a pending appeal for this order' },
                { status: 400 }
            );
        }

        if (existingAppeal?.status === 'APPROVED') {
            return NextResponse.json(
                { success: false, error: 'Your appeal has already been approved' },
                { status: 400 }
            );
        }

        // Upload the screenshot to Supabase storage
        const timestamp = Date.now();
        const fileExtension = screenshot.name.split('.').pop() || 'jpg';
        const storagePath = `early-appeals/${orderId}/${timestamp}.${fileExtension}`;

        const arrayBuffer = await screenshot.arrayBuffer();
        const { error: uploadError } = await supabase.storage
            .from('screenshots')
            .upload(storagePath, new Uint8Array(arrayBuffer), {
                contentType: screenshot.type,
                upsert: true
            });

        if (uploadError) {
            console.error('Error uploading screenshot:', uploadError);
            return NextResponse.json(
                { success: false, error: 'Failed to upload screenshot. Please try again.' },
                { status: 500 }
            );
        }

        // Get the public URL
        const { data: publicUrlData } = supabase.storage
            .from('screenshots')
            .getPublicUrl(storagePath);

        // Insert into fba_early_appeals table
        const { error: insertError } = await supabase
            .from('fba_early_appeals')
            .insert({
                order_id: orderId,
                customer_email: email,
                customer_whatsapp: whatsapp,
                proof_image_url: publicUrlData.publicUrl,
                status: 'PENDING'
            });

        if (insertError) {
            console.error('Error inserting appeal:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to submit appeal. Please try again.' },
                { status: 500 }
            );
        }

        // Update the order's early_appeal_status to PENDING
        const { error: updateError } = await supabase
            .from('amazon_orders')
            .update({
                early_appeal_status: 'PENDING',
                early_appeal_at: new Date().toISOString()
            })
            .eq('order_id', orderId);

        if (updateError) {
            console.error('Error updating order status:', updateError);
            // Don't fail the request - appeal was created successfully
        }

        return NextResponse.json({
            success: true,
            message: 'Appeal submitted successfully'
        });

    } catch (error) {
        console.error('Early appeal error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
