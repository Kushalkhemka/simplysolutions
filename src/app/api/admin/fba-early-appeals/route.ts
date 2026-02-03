/**
 * Admin API for managing FBA early delivery appeals
 * 
 * GET: List all appeals with filters
 * PUT: Approve or reject an appeal
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: List all appeals
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // 'PENDING', 'APPROVED', 'REJECTED', or null for all
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        let query = supabase
            .from('fba_early_appeals')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (status) {
            query = query.eq('status', status);
        }

        const { data, error, count } = await query;

        if (error) {
            console.error('Error fetching appeals:', error);
            return NextResponse.json({ error: 'Failed to fetch appeals' }, { status: 500 });
        }

        // Fetch order details for each appeal
        const orderIds = [...new Set(data?.map(a => a.order_id) || [])];
        const { data: orders } = await supabase
            .from('amazon_orders')
            .select('order_id, fsn, order_date, state, city, redeemable_at')
            .in('order_id', orderIds);

        const orderMap = new Map();
        orders?.forEach(o => orderMap.set(o.order_id, o));

        const appealsWithOrders = data?.map(appeal => ({
            ...appeal,
            order: orderMap.get(appeal.order_id) || null
        }));

        return NextResponse.json({
            success: true,
            data: appealsWithOrders,
            total: count,
            limit,
            offset
        });

    } catch (error) {
        console.error('Error in GET appeals:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// PUT: Approve or reject an appeal
export async function PUT(request: NextRequest) {
    try {
        const body = await request.json();
        const { id, action, rejectionReason, adminNotes, reviewedBy } = body;

        if (!id || !action) {
            return NextResponse.json(
                { error: 'Appeal ID and action are required' },
                { status: 400 }
            );
        }

        if (!['APPROVE', 'REJECT'].includes(action)) {
            return NextResponse.json(
                { error: 'Action must be APPROVE or REJECT' },
                { status: 400 }
            );
        }

        // Fetch the appeal
        const { data: appeal, error: fetchError } = await supabase
            .from('fba_early_appeals')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !appeal) {
            return NextResponse.json({ error: 'Appeal not found' }, { status: 404 });
        }

        if (appeal.status !== 'PENDING') {
            return NextResponse.json(
                { error: `Appeal has already been ${appeal.status.toLowerCase()}` },
                { status: 400 }
            );
        }

        const newStatus = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';

        // Update appeal
        const { error: updateError } = await supabase
            .from('fba_early_appeals')
            .update({
                status: newStatus,
                admin_notes: adminNotes || null,
                rejection_reason: action === 'REJECT' ? rejectionReason : null,
                reviewed_at: new Date().toISOString(),
                reviewed_by: reviewedBy || 'Admin'
            })
            .eq('id', id);

        if (updateError) {
            console.error('Error updating appeal:', updateError);
            return NextResponse.json({ error: 'Failed to update appeal' }, { status: 500 });
        }

        // Update order status
        const orderUpdate: { early_appeal_status: string; redeemable_at?: string } = {
            early_appeal_status: newStatus
        };

        // If approved, make order immediately redeemable
        if (action === 'APPROVE') {
            orderUpdate.redeemable_at = new Date().toISOString();
        }

        await supabase
            .from('amazon_orders')
            .update(orderUpdate)
            .eq('order_id', appeal.order_id);

        // Send notification to customer
        try {
            await sendAppealNotification({
                email: appeal.customer_email,
                whatsapp: appeal.customer_whatsapp,
                orderId: appeal.order_id,
                status: newStatus,
                rejectionReason: action === 'REJECT' ? rejectionReason : undefined
            });
        } catch (notifyError) {
            console.error('Error sending notification:', notifyError);
            // Don't fail the request if notification fails
        }

        return NextResponse.json({
            success: true,
            message: `Appeal ${newStatus.toLowerCase()} successfully`,
            status: newStatus
        });

    } catch (error) {
        console.error('Error in PUT appeal:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

// Helper function to send notifications
async function sendAppealNotification(params: {
    email: string;
    whatsapp: string;
    orderId: string;
    status: string;
    rejectionReason?: string;
}) {
    const { email, orderId, status, rejectionReason } = params;

    // Import Resend for email
    const { Resend } = await import('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    if (status === 'APPROVED') {
        // Send approval email
        await resend.emails.send({
            from: 'Simply Solutions <notifications@simplysolutions.in>',
            to: email,
            subject: `✅ Early Delivery Appeal Approved - Order ${orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #10B981;">🎉 Great News!</h2>
                    <p>Your early delivery appeal for Order <strong>${orderId}</strong> has been approved!</p>
                    <p>You can now activate your product immediately.</p>
                    
                    <div style="background-color: #F0FDF4; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <p style="margin: 0;"><strong>Next Step:</strong> Visit our activation page to redeem your product.</p>
                    </div>

                    <p style="color: #6B7280; font-size: 14px;">
                        Thank you for your patience. We apologize for any inconvenience caused by our security measures. 
                        These restrictions are in place to protect your purchase from unauthorized access and fraud.
                    </p>

                    <p>Best regards,<br/>Simply Solutions Team</p>
                </div>
            `
        });
    } else {
        // Send rejection email
        await resend.emails.send({
            from: 'Simply Solutions <notifications@simplysolutions.in>',
            to: email,
            subject: `Early Delivery Appeal Update - Order ${orderId}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <h2 style="color: #EF4444;">Appeal Update</h2>
                    <p>We reviewed your early delivery appeal for Order <strong>${orderId}</strong>.</p>
                    
                    <p>Unfortunately, we were unable to verify your proof of delivery at this time.</p>
                    
                    ${rejectionReason ? `
                        <div style="background-color: #FEF2F2; padding: 15px; border-radius: 8px; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Reason:</strong> ${rejectionReason}</p>
                        </div>
                    ` : ''}

                    <p>You can still activate your product once the estimated delivery date has passed.</p>
                    
                    <p style="color: #6B7280; font-size: 14px;">
                        We sincerely apologize for any inconvenience. These security measures are in place to protect 
                        your purchase from unauthorized access and fraud. Your order safety is our priority.
                    </p>

                    <p>If you believe this was an error, please contact our support team with additional proof.</p>

                    <p>Best regards,<br/>Simply Solutions Team</p>
                </div>
            `
        });
    }
}
