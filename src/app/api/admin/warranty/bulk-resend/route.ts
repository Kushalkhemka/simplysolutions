import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendWarrantyResubmissionEmail, sendWarrantyRejectionEmail } from '@/lib/emails/warranty-emails';
import { sendWarrantyResubmission, sendWarrantyRejected } from '@/lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getCustomerDetails(warranty: any) {
    const customerEmail = warranty.customer_email ||
        (warranty.contact && warranty.contact.includes('@') ? warranty.contact : null);

    let customerPhone = warranty.contact && !warranty.contact.includes('@') ? warranty.contact : null;
    if (!customerPhone) {
        const { data: orderData } = await supabase
            .from('amazon_orders')
            .select('buyer_phone_number')
            .eq('order_id', warranty.order_id)
            .maybeSingle();
        customerPhone = orderData?.buyer_phone_number || null;
    }

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

    return { customerEmail, customerPhone, productName };
}

// POST - Bulk resend or reject warranty claims
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { warrantyIds, action = 'resend' } = body;
        // action: 'resend' | 'reject'

        if (!['resend', 'reject'].includes(action)) {
            return NextResponse.json({ error: 'Action must be "resend" or "reject"' }, { status: 400 });
        }

        if (!warrantyIds || warrantyIds.length === 0) {
            return NextResponse.json({ error: 'No warranty IDs provided' }, { status: 400 });
        }

        const { data: warranties, error } = await supabase
            .from('warranty_registrations')
            .select('*')
            .in('id', warrantyIds);

        if (error) {
            console.error('Fetch error:', error);
            return NextResponse.json({ error: 'Failed to fetch warranties' }, { status: 500 });
        }

        if (!warranties || warranties.length === 0) {
            return NextResponse.json({
                success: true,
                message: 'No warranties found',
                sent: 0,
                failed: 0
            });
        }

        let sent = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const warranty of warranties) {
            try {
                const { customerEmail, customerPhone, productName } = await getCustomerDetails(warranty);

                if (action === 'resend') {
                    const missingSeller = warranty.missing_seller_feedback || false;
                    const missingReview = warranty.missing_product_review || false;

                    let emailSent = false;
                    let whatsappSent = false;

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

                } else if (action === 'reject') {
                    let emailSent = false;
                    let whatsappSent = false;

                    const rejectionReason = 'Warranty registration rejected: required screenshots were not submitted within the allowed timeframe.';

                    if (customerEmail) {
                        emailSent = await sendWarrantyRejectionEmail({
                            customerEmail,
                            orderId: warranty.order_id,
                            productName,
                            adminNotes: rejectionReason
                        });
                    }

                    if (customerPhone) {
                        try {
                            await sendWarrantyRejected(
                                customerPhone,
                                warranty.order_id,
                                productName || 'Your Product',
                                rejectionReason
                            );
                            whatsappSent = true;
                        } catch (whatsappError) {
                            console.error(`WhatsApp failed for ${warranty.order_id}:`, whatsappError);
                        }
                    }

                    await supabase
                        .from('warranty_registrations')
                        .update({
                            status: 'REJECTED',
                            rejection_reason: rejectionReason,
                            admin_notes: 'Bulk rejected — screenshots not submitted'
                        })
                        .eq('id', warranty.id);

                    sent++;
                }

                await new Promise(resolve => setTimeout(resolve, 200));

            } catch (err: any) {
                failed++;
                errors.push(`${warranty.order_id}: ${err.message}`);
                console.error(`Failed ${action} for ${warranty.order_id}:`, err);
            }
        }

        const actionLabel = action === 'resend' ? 'Resent resubmission' : 'Rejected';
        console.log(`[warranty] Bulk ${action}: ${sent} done, ${failed} failed out of ${warranties.length}`);

        return NextResponse.json({
            success: true,
            message: `${actionLabel}: ${sent} done, ${failed} failed`,
            total: warranties.length,
            sent,
            failed,
            errors: errors.length > 0 ? errors.slice(0, 10) : undefined
        });

    } catch (error: any) {
        console.error('Bulk action error:', error);
        return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
    }
}
