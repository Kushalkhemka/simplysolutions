import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// POST /api/activate/save-email - Save customer email for review requests
export async function POST(request: NextRequest) {
    try {
        const { orderId, email } = await request.json();

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

        const supabase = createClient(supabaseUrl, supabaseServiceKey);

        // Update the order with customer email
        const { error } = await supabase
            .from('amazon_orders')
            .update({
                contact_email: email.toLowerCase().trim(),
            })
            .eq('order_id', orderId.trim());

        if (error) {
            console.error('Error saving customer email:', error);
            return NextResponse.json(
                { success: false, error: 'Failed to save email' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Email saved successfully'
        });

    } catch (error) {
        console.error('Save email error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
