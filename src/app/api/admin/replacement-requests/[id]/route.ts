import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Approve or reject a replacement request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, adminNotes, newLicenseKeyId, reviewedBy } = body;

        if (!['approve', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be "approve" or "reject"' },
                { status: 400 }
            );
        }

        // Get the replacement request
        const { data: replacementRequest, error: fetchError } = await supabase
            .from('license_replacement_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !replacementRequest) {
            return NextResponse.json(
                { error: 'Replacement request not found' },
                { status: 404 }
            );
        }

        if (replacementRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This request has already been processed' },
                { status: 400 }
            );
        }

        if (action === 'approve') {
            if (!newLicenseKeyId) {
                return NextResponse.json(
                    { error: 'New license key ID is required for approval' },
                    { status: 400 }
                );
            }

            // Verify the new license key exists and is available
            const { data: newKey, error: keyError } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key, is_redeemed')
                .eq('id', newLicenseKeyId)
                .single();

            if (keyError || !newKey) {
                return NextResponse.json(
                    { error: 'New license key not found' },
                    { status: 404 }
                );
            }

            if (newKey.is_redeemed) {
                return NextResponse.json(
                    { error: 'Selected license key is already redeemed. Please choose an available key.' },
                    { status: 400 }
                );
            }

            // Mark the new license key as redeemed
            await supabase
                .from('amazon_activation_license_keys')
                .update({ is_redeemed: true, redeemed_at: new Date().toISOString() })
                .eq('id', newLicenseKeyId);

            // Update the amazon_orders table to point to the new license key
            await supabase
                .from('amazon_orders')
                .update({ license_key_id: newLicenseKeyId })
                .eq('order_id', replacementRequest.order_id);

            // Update the replacement request
            const { error: updateError } = await supabase
                .from('license_replacement_requests')
                .update({
                    status: 'APPROVED',
                    admin_notes: adminNotes || 'Replacement approved',
                    new_license_key_id: newLicenseKeyId,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewedBy || null
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating replacement request:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update replacement request' },
                    { status: 500 }
                );
            }

            // Send email notification to customer
            if (resendApiKey && replacementRequest.customer_email) {
                try {
                    const resend = new Resend(resendApiKey);
                    await resend.emails.send({
                        from: 'SimplySolutions <support@simplysolutions.co.in>',
                        to: replacementRequest.customer_email,
                        subject: 'Your License Key Replacement Has Been Approved - SimplySolutions',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #067D62, #0A9A77); padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0;">License Key Replacement Approved!</h1>
                                </div>
                                <div style="padding: 30px; background: #f9fafb;">
                                    <p>Dear Customer,</p>
                                    <p>Great news! Your license key replacement request for <strong>Order ID: ${replacementRequest.order_id}</strong> has been approved.</p>
                                    
                                    <div style="background: #fff; border: 2px solid #FF9900; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
                                        <p style="margin: 0 0 10px 0; color: #565959; font-size: 14px;">Your New License Key:</p>
                                        <p style="font-family: monospace; font-size: 18px; font-weight: bold; color: #0F1111; margin: 0;">${newKey.license_key}</p>
                                    </div>

                                    <p>You can also access your new license key by visiting our activation page:</p>
                                    <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}/activate" style="color: #007185;">Visit Activation Page</a></p>
                                    
                                    <p>Need help? Contact our support team on WhatsApp: <a href="https://wa.me/918595899215" style="color: #007185;">8595899215</a></p>
                                    
                                    <p>Thank you for your patience!</p>
                                    <p>Best regards,<br>SimplySolutions Team</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send approval email:', emailError);
                    // Don't fail the request if email fails
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Replacement request approved successfully',
                newLicenseKey: newKey.license_key
            });

        } else {
            // Reject the request
            if (!adminNotes) {
                return NextResponse.json(
                    { error: 'Admin notes are required for rejection' },
                    { status: 400 }
                );
            }

            const { error: updateError } = await supabase
                .from('license_replacement_requests')
                .update({
                    status: 'REJECTED',
                    admin_notes: adminNotes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewedBy || null
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating replacement request:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update replacement request' },
                    { status: 500 }
                );
            }

            // Send email notification to customer about rejection
            if (resendApiKey && replacementRequest.customer_email) {
                try {
                    const resend = new Resend(resendApiKey);
                    await resend.emails.send({
                        from: 'SimplySolutions <support@simplysolutions.co.in>',
                        to: replacementRequest.customer_email,
                        subject: 'License Key Replacement Request Update - SimplySolutions',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #232F3E; padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0;">License Key Replacement Update</h1>
                                </div>
                                <div style="padding: 30px; background: #f9fafb;">
                                    <p>Dear Customer,</p>
                                    <p>We have reviewed your license key replacement request for <strong>Order ID: ${replacementRequest.order_id}</strong>.</p>
                                    
                                    <div style="background: #FEF2F2; border-left: 4px solid #CC0C39; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; color: #0F1111;"><strong>Status:</strong> Request Not Approved</p>
                                        <p style="margin: 10px 0 0 0; color: #565959;"><strong>Reason:</strong> ${adminNotes}</p>
                                    </div>

                                    <p>If you believe this is an error or need further assistance, please contact our support team on WhatsApp: <a href="https://wa.me/918595899215" style="color: #007185;">8595899215</a></p>
                                    
                                    <p>Best regards,<br>SimplySolutions Team</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                    // Don't fail the request if email fails
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Replacement request rejected'
            });
        }

    } catch (error) {
        console.error('Admin replacement request update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get single replacement request details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: replacementRequest, error } = await supabase
            .from('license_replacement_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !replacementRequest) {
            return NextResponse.json(
                { error: 'Replacement request not found' },
                { status: 404 }
            );
        }

        // Get license key details
        let originalKey = null;
        let newKey = null;

        if (replacementRequest.original_license_key_id) {
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key, fsn')
                .eq('id', replacementRequest.original_license_key_id)
                .single();
            originalKey = data;
        }

        if (replacementRequest.new_license_key_id) {
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key, fsn')
                .eq('id', replacementRequest.new_license_key_id)
                .single();
            newKey = data;
        }

        // Get available license keys for the same FSN (for approval selection)
        let availableKeys: { id: string; license_key: string }[] = [];
        if (replacementRequest.fsn && replacementRequest.status === 'PENDING') {
            const { data: keys } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key')
                .eq('fsn', replacementRequest.fsn)
                .eq('is_redeemed', false)
                .limit(50);
            availableKeys = keys || [];
        }

        return NextResponse.json({
            success: true,
            data: {
                ...replacementRequest,
                original_license_key: originalKey?.license_key || null,
                new_license_key: newKey?.license_key || null,
                available_keys: availableKeys
            }
        });

    } catch (error) {
        console.error('Get replacement request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
