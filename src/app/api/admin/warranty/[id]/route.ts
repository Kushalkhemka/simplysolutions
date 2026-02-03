import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    sendWarrantyApprovalEmail,
    sendWarrantyRejectionEmail,
    sendWarrantyResubmissionEmail
} from '@/lib/emails/warranty-emails';
import { notifyWarrantyStatus } from '@/lib/push/customer-notifications';
import {
    sendWarrantyApproved,
    sendWarrantyRejected,
    sendWarrantyResubmission
} from '@/lib/whatsapp';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// PATCH - Update warranty status (approve, reject, request resubmission)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const {
            action, // 'approve' | 'reject' | 'resubmit'
            adminNotes,
            missingSeller,
            missingReview
        } = body;

        if (!action || !['approve', 'reject', 'resubmit'].includes(action)) {
            return NextResponse.json(
                { error: 'Valid action required: approve, reject, or resubmit' },
                { status: 400 }
            );
        }

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

        // Get order details for email
        let productName = warranty.product_name;
        let quantity = warranty.quantity || 1;
        let purchaseDate = warranty.purchase_date;

        // Try to get order info if not already stored
        if (!productName) {
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('fsn, quantity, order_date')
                .eq('order_id', warranty.order_id)
                .single();

            if (order) {
                quantity = order.quantity || 1;
                purchaseDate = order.order_date;

                // Get product name from FSN
                if (order.fsn) {
                    const { data: product } = await supabase
                        .from('products_data')
                        .select('product_title')
                        .eq('fsn', order.fsn)
                        .single();

                    if (product) {
                        productName = product.product_title;
                    }
                }
            }
        }

        let updateData: any = {
            admin_notes: adminNotes || null,
            product_name: productName,
            quantity,
            purchase_date: purchaseDate
        };

        let emailSent = false;

        // Get customer email - prefer customer_email, fallback to contact if it looks like an email
        const getCustomerEmail = () => {
            if (warranty.customer_email) return warranty.customer_email;
            // Check if contact looks like an email
            if (warranty.contact && warranty.contact.includes('@')) return warranty.contact;
            return null;
        };
        const customerEmail = getCustomerEmail();

        // Get customer phone from warranty contact or amazon_orders
        let customerPhone = warranty.contact && !warranty.contact.includes('@') ? warranty.contact : null;
        if (!customerPhone) {
            const { data: orderData } = await supabase
                .from('amazon_orders')
                .select('buyer_phone_number')
                .eq('order_id', warranty.order_id)
                .single();
            customerPhone = orderData?.buyer_phone_number || null;
        }

        if (action === 'approve') {
            updateData.status = 'VERIFIED';
            updateData.verified_at = new Date().toISOString();
            updateData.missing_seller_feedback = false;
            updateData.missing_product_review = false;

            // Send approval email
            if (customerEmail) {
                emailSent = await sendWarrantyApprovalEmail({
                    customerEmail,
                    orderId: warranty.order_id,
                    productName,
                    quantity,
                    purchaseDate
                });
            }

            // Send push notification
            try {
                await notifyWarrantyStatus(warranty.order_id, 'approved', productName);
            } catch (pushError) {
                console.error('Failed to send warranty approval push:', pushError);
            }

            // Send WhatsApp notification
            if (customerPhone) {
                try {
                    const formattedDate = purchaseDate
                        ? new Date(purchaseDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                        : 'N/A';
                    await sendWarrantyApproved(customerPhone, warranty.order_id, productName || 'Your Product', formattedDate);
                    console.log(`WhatsApp warranty_approved sent to ${customerPhone}`);
                } catch (whatsappError) {
                    console.error('Failed to send WhatsApp warranty approval:', whatsappError);
                }
            }

        } else if (action === 'reject') {
            updateData.status = 'REJECTED';
            updateData.rejection_reason = adminNotes || 'Could not verify warranty';

            // Send rejection email
            if (customerEmail) {
                emailSent = await sendWarrantyRejectionEmail({
                    customerEmail,
                    orderId: warranty.order_id,
                    productName,
                    adminNotes
                });
            }

            // Send push notification
            try {
                await notifyWarrantyStatus(warranty.order_id, 'rejected', productName);
            } catch (pushError) {
                console.error('Failed to send warranty rejection push:', pushError);
            }

            // Send WhatsApp notification
            if (customerPhone) {
                try {
                    await sendWarrantyRejected(customerPhone, warranty.order_id, productName || 'Your Product', adminNotes || 'Could not verify warranty');
                    console.log(`WhatsApp warranty_rejected sent to ${customerPhone}`);
                } catch (whatsappError) {
                    console.error('Failed to send WhatsApp warranty rejection:', whatsappError);
                }
            }

        } else if (action === 'resubmit') {
            if (!missingSeller && !missingReview) {
                return NextResponse.json(
                    { error: 'Please select at least one missing screenshot' },
                    { status: 400 }
                );
            }

            updateData.status = 'NEEDS_RESUBMISSION';
            updateData.missing_seller_feedback = missingSeller || false;
            updateData.missing_product_review = missingReview || false;
            // Reset reminder count for fresh reminder cycle
            updateData.reminder_count = 0;
            updateData.last_reminder_sent_at = null;

            // Keep existing screenshots - they will be overwritten when customer uploads new ones
            // Don't delete them immediately so admin can still review them if needed

            // Send resubmission email
            if (customerEmail) {
                emailSent = await sendWarrantyResubmissionEmail({
                    customerEmail,
                    orderId: warranty.order_id,
                    productName,
                    missingSeller: missingSeller || false,
                    missingReview: missingReview || false,
                    adminNotes
                });
            }

            // Send WhatsApp notification for resubmission
            if (customerPhone) {
                try {
                    const requiredDoc = missingSeller && missingReview
                        ? 'Seller Feedback & Product Review Screenshots'
                        : missingSeller
                            ? 'Seller Feedback Screenshot'
                            : 'Product Review Screenshot';
                    await sendWarrantyResubmission(customerPhone, warranty.order_id, requiredDoc, adminNotes || 'Please upload the missing screenshot(s)');
                    console.log(`WhatsApp warranty_resubmission sent to ${customerPhone}`);
                } catch (whatsappError) {
                    console.error('Failed to send WhatsApp warranty resubmission:', whatsappError);
                }
            }
        }

        // Update the warranty registration
        const { error: updateError } = await supabase
            .from('warranty_registrations')
            .update(updateData)
            .eq('id', id);

        if (updateError) {
            console.error('Update error:', updateError);
            return NextResponse.json(
                { error: 'Failed to update warranty status' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: action === 'approve'
                ? 'Warranty approved successfully'
                : action === 'reject'
                    ? 'Warranty rejected'
                    : 'Resubmission request sent',
            emailSent,
            noEmail: !warranty.customer_email
        });

    } catch (error) {
        console.error('Warranty update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// GET - Get warranty details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: warranty, error } = await supabase
            .from('warranty_registrations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !warranty) {
            return NextResponse.json(
                { error: 'Warranty registration not found' },
                { status: 404 }
            );
        }

        // Get order details
        let orderDetails = null;
        const { data: order } = await supabase
            .from('amazon_orders')
            .select('fsn, quantity, order_date, order_total')
            .eq('order_id', warranty.order_id)
            .single();

        if (order) {
            let productName = null;
            if (order.fsn) {
                const { data: product } = await supabase
                    .from('products_data')
                    .select('product_title')
                    .eq('fsn', order.fsn)
                    .single();
                productName = product?.product_title;
            }

            orderDetails = {
                productName,
                quantity: order.quantity || 1,
                purchaseDate: order.order_date,
                orderTotal: order.order_total
            };
        }

        return NextResponse.json({
            success: true,
            warranty,
            orderDetails
        });

    } catch (error) {
        console.error('Warranty fetch error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
