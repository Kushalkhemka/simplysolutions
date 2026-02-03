import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/activate/save-email - Save customer email and optional WhatsApp for future communication
export async function POST(request: NextRequest) {
    try {
        const { orderId, email, whatsapp } = await request.json();

        if (!orderId || !email) {
            return NextResponse.json(
                { success: false, error: 'Order ID and email are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate WhatsApp format if provided
        if (whatsapp && !/^\+91\d{10}$/.test(whatsapp)) {
            return NextResponse.json(
                { success: false, error: 'Invalid WhatsApp number format' },
                { status: 400 }
            );
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Build update object
        const updateData: { contact_email: string; contact_phone?: string } = {
            contact_email: email.toLowerCase().trim(),
        };

        // Add WhatsApp if provided
        if (whatsapp) {
            updateData.contact_phone = whatsapp;
        }

        // Update the order with customer contact details
        const { error } = await supabase
            .from('amazon_orders')
            .update(updateData)
            .eq('order_id', orderId.trim());

        if (error) {
            console.error('Error saving customer contact:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to save contact details' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Contact details saved successfully'
        });

    } catch (error) {
        console.error('Save email error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
