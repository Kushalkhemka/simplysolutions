import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    sendWarrantyResubmissionEmail
} from '@/lib/emails/warranty-emails';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Resend warranty email (resubmission request)
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Fetch the warranty registration
        const { data: warranty, error: fetchError } = await supabase
            .from('warranty_registrations')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !warranty) {
            return NextResponse.json(
                { error: 'Warranty registration not found' },
                { status: 404 }
            );
        }

        // Get customer email - prefer customer_email, fallback to contact if it looks like an email
        const customerEmail = warranty.customer_email ||
            (warranty.contact && warranty.contact.includes('@') ? warranty.contact : null);

        // Check if customer email exists
        if (!customerEmail) {
            return NextResponse.json(
                { error: 'No customer email available. Cannot send email.' },
                { status: 400 }
            );
        }

        // Get product name
        let productName = warranty.product_name;
        if (!productName) {
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('fsn')
                .eq('order_id', warranty.order_id)
                .single();

            if (order?.fsn) {
                const { data: product } = await supabase
                    .from('products_data')
                    .select('product_title')
                    .eq('fsn', order.fsn)
                    .single();
                productName = product?.product_title;
            }
        }

        // Determine what's missing
        const missingSeller = warranty.missing_seller_feedback || !warranty.screenshot_seller_feedback;
        const missingReview = warranty.missing_product_review || !warranty.screenshot_product_review;

        // Send the resubmission email
        const emailSent = await sendWarrantyResubmissionEmail({
            customerEmail,
            orderId: warranty.order_id,
            productName,
            missingSeller,
            missingReview,
            adminNotes: warranty.admin_notes
        });

        if (!emailSent) {
            return NextResponse.json(
                { error: 'Failed to send email. Please try again.' },
                { status: 500 }
            );
        }

        // Update last email sent timestamp
        await supabase
            .from('warranty_registrations')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', id);

        return NextResponse.json({
            success: true,
            message: 'Resubmission email sent successfully',
            emailSent: true
        });

    } catch (error) {
        console.error('Resend email error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
