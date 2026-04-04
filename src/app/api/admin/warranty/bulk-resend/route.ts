import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWarrantyResubmissionEmail } from '@/lib/emails/warranty-emails';
import { sendWarrantyResubmission } from '@/lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// POST - Bulk resend resubmission emails for NEEDS_RESUBMISSION warranties
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { warrantyIds } = body; // optional: specific IDs, otherwise all NEEDS_RESUBMISSION

        let query = supabase
            .from('warranty_registrations')
            .select('*')
            .eq('status', 'NEEDS_RESUBMISSION');

        if (warrantyIds && warrantyIds.length > 0) {
            query = query.in('id', warrantyIds);
        }

        const { data: warranties, error } = await query;

        if (error) {
            console.error('Fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch warranties' }, { status: 500 });
        }

        if (!warranties || warranties.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No warranties found to resend',
                sent: 0,
                failed: 0
            });
        }

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const warranty of warranties) {
            try {
                // Get customer email
                const customerEmail = warranty.customer_email ||
                    (warranty.contact && warranty.contact.includes('@') ? warranty.contact : null);

                // Get customer phone
                let customerPhone = warranty.contact && !warranty.contact.includes('@') ? warranty.contact : null;
                if (!customerPhone) {
                    const { data: orderData } = await supabase
                        .from('amazon_orders')
                        .select('buyer_phone_number')
                        .eq('order_id', warranty.order_id)
                        .maybeSingle();
                    customerPhone = orderData?.buyer_phone_number || null;
                }

                // Get product name
                let productName = warranty.product_name;
                if (!productName) {
                    const { data: order } = await supabase
                        .from('amazon_orders')
                        .select('fsn')
                        .eq('order_id', warranty.order_id)
                        .maybeSingle();
                    if (order?.fsn) {
                        const { data: product } = await supabase
                            .from('products_data')
                            .select('product_title')
                            .eq('fsn', order.fsn)
                            .single();
                        productName = product?.product_title || null;
                    }
                }

                const missingSeller = warranty.missing_seller_feedback || false;
                const missingReview = warranty.missing_product_review || false;

                let emailSent = false;
                let whatsappSent = false;

                // Send email
                if (customerEmail) {
                    emailSent = await sendWarrantyResubmissionEmail({
                        customerEmail,
                        orderId: warranty.order_id,
                        productName,
                        missingSeller,
                        missingReview,
                        adminNotes: 'Reminder: Please upload the required screenshots to complete your warranty registration.'
                    });
                }

                // Send WhatsApp
                if (customerPhone) {
                    try {
                        const requiredDoc = missingSeller && missingReview
                            ? 'Seller Feedback & Product Review Screenshots'
                            : missingSeller
                                ? 'Seller Feedback Screenshot'
                                : 'Product Review Screenshot';
                        await sendWarrantyResubmission(
                            customerPhone,
                            warranty.order_id,
                            requiredDoc,
                            'Reminder: Please upload the missing screenshot(s) to complete your warranty registration.'
                        );
                        whatsappSent = true;
                    } catch (whatsappError) {
                        console.error(`WhatsApp failed for ${warranty.order_id}:`, whatsappError);
                    }
                }

                // Update reminder tracking
                await supabase
                    .from('warranty_registrations')
                    .update({
                        reminder_count: (warranty.reminder_count || 0) + 1,
                        last_reminder_sent_at: new Date().toISOString()
                    })
                    .eq('id', warranty.id);

                if (emailSent || whatsappSent) {
                    sent++;
                } else {
                    failed++;
                    errors.push(`${warranty.order_id}: No email/phone available`);
                }

                // Small delay to avoid rate limits
                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err: any) {
                failed++;
                errors.push(`${warranty.order_id}: ${err.message}`);
                console.error(`Failed to resend for ${warranty.order_id}:`, err);
            }
        }

        console.log(`[warranty] Bulk resend: ${sent} sent, ${failed} failed out of ${warranties.length}`);

        return NextResponse.json({
            success: true,
            message: `Resent resubmission notices: ${sent} sent, ${failed} failed`,
            total: warranties.length,
            sent,
            failed,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined // Cap at 10 errors
        });

    } catch (error: any) {
        console.error('Bulk resend error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
