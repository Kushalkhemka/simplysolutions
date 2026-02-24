import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Complete or reject a password reset request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, newPassword, adminNotes, reviewedBy } = body;

        if (!['complete', 'reject'].includes(action)) {
            return NextResponse.json(
                { error: 'Invalid action. Must be "complete" or "reject"' },
                { status: 400 }
            );
        }

        // Get the password reset request
        const { data: resetRequest, error: fetchError } = await supabase
            .from('password_reset_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !resetRequest) {
            return NextResponse.json(
                { error: 'Password reset request not found' },
                { status: 404 }
            );
        }

        if (resetRequest.status !== 'PENDING') {
            return NextResponse.json(
                { error: 'This request has already been processed' },
                { status: 400 }
            );
        }

        if (action === 'complete') {
            if (!newPassword || !newPassword.trim()) {
                return NextResponse.json(
                    { error: 'New password is required to complete the request' },
                    { status: 400 }
                );
            }

            const trimmedPassword = newPassword.trim();

            // Update the license key with the new password
            if (resetRequest.original_license_key_id) {
                // Get the current license key
                const { data: currentKey } = await supabase
                    .from('amazon_activation_license_keys')
                    .select('license_key')
                    .eq('id', resetRequest.original_license_key_id)
                    .single();

                if (currentKey) {
                    // Build the new license key string
                    const newLicenseKey = `Username: ${resetRequest.username} | Password: ${trimmedPassword}`;

                    // Update the license key
                    const { error: updateKeyError } = await supabase
                        .from('amazon_activation_license_keys')
                        .update({ license_key: newLicenseKey })
                        .eq('id', resetRequest.original_license_key_id);

                    if (updateKeyError) {
                        console.error('Error updating license key:', updateKeyError);
                        return NextResponse.json(
                            { error: 'Failed to update license key' },
                            { status: 500 }
                        );
                    }
                }
            }

            // Update the password reset request
            const { error: updateError } = await supabase
                .from('password_reset_requests')
                .update({
                    status: 'COMPLETED',
                    new_password: trimmedPassword,
                    admin_notes: adminNotes || 'Password reset completed',
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewedBy || null
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating password reset request:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update password reset request' },
                    { status: 500 }
                );
            }

            // Send email notification to customer
            if (resendApiKey && resetRequest.communication_email) {
                try {
                    const resend = new Resend(resendApiKey);
                    await resend.emails.send({
                        from: 'SimplySolutions <support@auth.simplysolutions.co.in>',
                        to: resetRequest.communication_email,
                        subject: 'Your Password Has Been Reset - SimplySolutions',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: linear-gradient(135deg, #067D62, #0A9A77); padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0;">Password Reset Complete!</h1>
                                </div>
                                <div style="padding: 30px; background: #f9fafb;">
                                    <p>Dear Customer,</p>
                                    <p>Great news! Your password reset request for <strong>Order ID: ${resetRequest.order_id}</strong> has been completed.</p>
                                    
                                    <div style="background: #fff; border: 2px solid #FF9900; border-radius: 8px; padding: 20px; margin: 20px 0;">
                                        <p style="margin: 0 0 10px 0; color: #565959; font-size: 14px;">Your Updated Credentials:</p>
                                        <p style="font-family: monospace; font-size: 16px; color: #0F1111; margin: 5px 0;"><strong>Username:</strong> ${resetRequest.username}</p>
                                        <p style="font-family: monospace; font-size: 16px; color: #0F1111; margin: 5px 0;"><strong>New Password:</strong> ${trimmedPassword}</p>
                                    </div>

                                    <p>Please sign in with your new credentials at <a href="https://www.office.com" style="color: #007185;">office.com</a></p>
                                    
                                    <p>Need help? Contact our support team on WhatsApp: <a href="https://wa.me/918178848830" style="color: #007185;">8178848830</a></p>
                                    
                                    <p>Thank you for your patience!</p>
                                    <p>Best regards,<br>SimplySolutions Team</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send password reset email:', emailError);
                    // Don't fail the request if email fails
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Password reset completed successfully. Customer has been notified.',
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
                .from('password_reset_requests')
                .update({
                    status: 'REJECTED',
                    admin_notes: adminNotes,
                    reviewed_at: new Date().toISOString(),
                    reviewed_by: reviewedBy || null
                })
                .eq('id', id);

            if (updateError) {
                console.error('Error updating password reset request:', updateError);
                return NextResponse.json(
                    { error: 'Failed to update password reset request' },
                    { status: 500 }
                );
            }

            // Send rejection email
            if (resendApiKey && resetRequest.communication_email) {
                try {
                    const resend = new Resend(resendApiKey);
                    await resend.emails.send({
                        from: 'SimplySolutions <support@auth.simplysolutions.co.in>',
                        to: resetRequest.communication_email,
                        subject: 'Password Reset Request Update - SimplySolutions',
                        html: `
                            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                                <div style="background: #232F3E; padding: 20px; text-align: center;">
                                    <h1 style="color: white; margin: 0;">Password Reset Update</h1>
                                </div>
                                <div style="padding: 30px; background: #f9fafb;">
                                    <p>Dear Customer,</p>
                                    <p>We have reviewed your password reset request for <strong>Order ID: ${resetRequest.order_id}</strong>.</p>
                                    
                                    <div style="background: #FEF2F2; border-left: 4px solid #CC0C39; padding: 15px; margin: 20px 0;">
                                        <p style="margin: 0; color: #0F1111;"><strong>Status:</strong> Request Not Approved</p>
                                        <p style="margin: 10px 0 0 0; color: #565959;"><strong>Reason:</strong> ${adminNotes}</p>
                                    </div>

                                    <p>If you believe this is an error or need further assistance, please contact our support team on WhatsApp: <a href="https://wa.me/918178848830" style="color: #007185;">8178848830</a></p>
                                    
                                    <p>Best regards,<br>SimplySolutions Team</p>
                                </div>
                            </div>
                        `
                    });
                } catch (emailError) {
                    console.error('Failed to send rejection email:', emailError);
                }
            }

            return NextResponse.json({
                success: true,
                message: 'Password reset request rejected'
            });
        }

    } catch (error) {
        console.error('Admin password reset request update error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Get single password reset request details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: resetRequest, error } = await supabase
            .from('password_reset_requests')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !resetRequest) {
            return NextResponse.json(
                { error: 'Password reset request not found' },
                { status: 404 }
            );
        }

        // Get the current license key
        let currentLicenseKey = null;
        if (resetRequest.original_license_key_id) {
            const { data } = await supabase
                .from('amazon_activation_license_keys')
                .select('license_key')
                .eq('id', resetRequest.original_license_key_id)
                .single();
            currentLicenseKey = data?.license_key || null;
        }

        return NextResponse.json({
            success: true,
            data: {
                ...resetRequest,
                current_license_key: currentLicenseKey
            }
        });

    } catch (error) {
        console.error('Get password reset request error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
