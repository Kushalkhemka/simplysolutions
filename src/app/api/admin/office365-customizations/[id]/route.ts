import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// GET: Get single customization request details
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const { data: customization, error } = await supabase
            .from('office365_customizations')
            .select('*')
            .eq('id', id)
            .single();

        if (error || !customization) {
            return NextResponse.json(
                { error: 'Customization request not found' },
                { status: 404 }
            );
        }

        // Get the current license key from amazon_orders
        let currentLicenseKey = null;
        let licenseKeyId = null;
        if (customization.order_id) {
            // First check amazon_orders for direct license_key
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('license_key')
                .eq('order_id', customization.order_id)
                .single();

            currentLicenseKey = order?.license_key || null;

            // Also check amazon_activation_license_keys
            const { data: licenseKeyRow } = await supabase
                .from('amazon_activation_license_keys')
                .select('id, license_key')
                .eq('order_id', customization.order_id)
                .maybeSingle();

            if (licenseKeyRow) {
                currentLicenseKey = licenseKeyRow.license_key;
                licenseKeyId = licenseKeyRow.id;
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                ...customization,
                current_license_key: currentLicenseKey,
                license_key_id: licenseKeyId
            }
        });

    } catch (error) {
        console.error('Get office365 customization error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PATCH: Fulfill a customization request
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { action, adminNotes, rejectionReason } = body;

        if (action !== 'fulfill' && action !== 'reject') {
            return NextResponse.json(
                { error: 'Invalid action. Must be "fulfill" or "reject"' },
                { status: 400 }
            );
        }

        // Get the customization request
        const { data: customization, error: fetchError } = await supabase
            .from('office365_customizations')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !customization) {
            return NextResponse.json(
                { error: 'Customization request not found' },
                { status: 404 }
            );
        }

        if (customization.is_completed) {
            return NextResponse.json(
                { error: 'This request has already been fulfilled' },
                { status: 400 }
            );
        }

        if (customization.is_rejected) {
            return NextResponse.json(
                { error: 'This request has already been rejected' },
                { status: 400 }
            );
        }

        // ── REJECT ACTION ──
        if (action === 'reject') {
            const { error: rejectError } = await supabase
                .from('office365_customizations')
                .update({
                    is_rejected: true,
                    rejection_reason: rejectionReason || 'Your customization request was rejected by the admin.',
                    rejected_at: new Date().toISOString()
                })
                .eq('id', id);

            if (rejectError) {
                console.error('Error rejecting customization:', rejectError);
                return NextResponse.json(
                    { error: 'Failed to reject request' },
                    { status: 500 }
                );
            }

            // Send rejection email
            let customerEmail = customization.customer_email;
            if (!customerEmail) {
                const { data: warranty } = await supabase
                    .from('warranty_registrations')
                    .select('customer_email')
                    .eq('order_id', customization.order_id)
                    .maybeSingle();
                if (warranty?.customer_email) customerEmail = warranty.customer_email;
            }
            if (!customerEmail) {
                const { data: order } = await supabase
                    .from('amazon_orders')
                    .select('contact_email')
                    .eq('order_id', customization.order_id)
                    .maybeSingle();
                if (order?.contact_email && !order.contact_email.includes('@marketplace.amazon')) {
                    customerEmail = order.contact_email;
                }
            }

            if (resendApiKey && customerEmail) {
                try {
                    const resend = new Resend(resendApiKey);
                    await resend.emails.send({
                        from: 'SimplySolutions <support@auth.simplysolutions.co.in>',
                        to: customerEmail,
                        subject: `Username Customization Update - Order ${customization.order_id}`,
                        html: `
                            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f6f8;">
                                <div style="padding: 32px 20px;">
                                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                        <tr>
                                            <td style="text-align: center;">
                                                <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #DC3E15; letter-spacing: -0.5px;">SimplySolutions</h1>
                                                <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Account Notification</p>
                                            </td>
                                        </tr>
                                    </table>
                                    <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08);">
                                        <div style="background: linear-gradient(135deg, #DC2626, #991B1B); padding: 28px 24px; text-align: center;">
                                            <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">Username Customization Update</h2>
                                            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px;">Hi ${customization.first_name || 'there'}, we have an update on your request.</p>
                                        </div>
                                        <div style="padding: 28px 24px;">
                                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                                <tr>
                                                    <td style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0;">
                                                        <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Order ID</span><br />
                                                        <span style="font-size: 14px; color: #334155; font-weight: 600; font-family: 'Courier New', monospace;">${customization.order_id}</span>
                                                    </td>
                                                </tr>
                                            </table>
                                            <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 16px; margin-bottom: 20px;">
                                                <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #991B1B;">Your customization request for <strong style="font-family: 'Courier New', monospace;">${customization.username_prefix}@ms365.pro</strong> could not be processed.</p>
                                                ${rejectionReason ? `<p style="margin: 0; font-size: 13px; color: #DC2626;"><strong>Reason:</strong> ${rejectionReason}</p>` : ''}
                                            </div>
                                            <div style="background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px; padding: 16px;">
                                                <p style="margin: 0; font-size: 14px; color: #1e40af;">
                                                    <strong>What to do next:</strong> You can submit a new customization request with a different username by visiting your activation page.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                                        <p style="margin: 0; font-size: 11px; color: #94a3b8;">&copy; ${new Date().getFullYear()} SimplySolutions. All rights reserved.</p>
                                    </div>
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
                message: 'Customization request rejected. Customer has been notified.'
            });
        }

        // ── FULFILL ACTION ──
        let currentLicenseKey = null;
        const { data: licenseKeyRow } = await supabase
            .from('amazon_activation_license_keys')
            .select('id, license_key')
            .eq('order_id', customization.order_id)
            .maybeSingle();

        if (licenseKeyRow) {
            currentLicenseKey = licenseKeyRow.license_key;
        } else {
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('license_key')
                .eq('order_id', customization.order_id)
                .single();
            currentLicenseKey = order?.license_key || null;
        }

        // Extract password from existing license key (format: "Username: X | Password: Y")
        let existingPassword = '';
        if (currentLicenseKey) {
            const passwordMatch = currentLicenseKey.match(/Password\s*:\s*(.+)/i);
            if (passwordMatch) {
                existingPassword = passwordMatch[1].trim();
            }
        }

        if (!existingPassword) {
            return NextResponse.json(
                { error: 'Could not extract password from existing license key. Please update the license key manually.' },
                { status: 400 }
            );
        }

        const generatedEmail = `${customization.username_prefix}@ms365.pro`;
        const newLicenseKey = `Username: ${generatedEmail} | Password: ${existingPassword}`;

        // 1. Update the customization request
        const { error: updateCustomizationError } = await supabase
            .from('office365_customizations')
            .update({
                is_completed: true,
                generated_email: generatedEmail,
                completed_at: new Date().toISOString()
            })
            .eq('id', id);

        if (updateCustomizationError) {
            console.error('Error updating customization:', updateCustomizationError);
            return NextResponse.json(
                { error: 'Failed to update customization request' },
                { status: 500 }
            );
        }

        // 2. Update the license key in amazon_activation_license_keys
        const { data: existingKeyRow } = await supabase
            .from('amazon_activation_license_keys')
            .select('id')
            .eq('order_id', customization.order_id)
            .maybeSingle();

        if (existingKeyRow) {
            const { error: updateKeyError } = await supabase
                .from('amazon_activation_license_keys')
                .update({ license_key: newLicenseKey })
                .eq('id', existingKeyRow.id);

            if (updateKeyError) {
                console.error('Error updating license key:', updateKeyError);
                // Continue anyway
            }
        }

        // 3. Also update amazon_orders license_key
        const { error: updateOrderError } = await supabase
            .from('amazon_orders')
            .update({ license_key: newLicenseKey })
            .eq('order_id', customization.order_id);

        if (updateOrderError) {
            console.error('Error updating amazon order:', updateOrderError);
            // Continue anyway
        }

        // 4. Send email notification to customer
        let customerEmail = customization.customer_email;

        // Fallback: look up email from warranty_registrations if not on the customization record
        if (!customerEmail) {
            const { data: warranty } = await supabase
                .from('warranty_registrations')
                .select('customer_email')
                .eq('order_id', customization.order_id)
                .maybeSingle();
            if (warranty?.customer_email) customerEmail = warranty.customer_email;
        }
        // Fallback 2: look up from amazon_orders contact_email
        if (!customerEmail) {
            const { data: order } = await supabase
                .from('amazon_orders')
                .select('contact_email')
                .eq('order_id', customization.order_id)
                .maybeSingle();
            if (order?.contact_email && !order.contact_email.includes('@marketplace.amazon')) {
                customerEmail = order.contact_email;
            }
        }

        if (resendApiKey && customerEmail) {
            try {
                const resend = new Resend(resendApiKey);
                await resend.emails.send({
                    from: 'SimplySolutions <support@auth.simplysolutions.co.in>',
                    to: customerEmail,
                    subject: `Your Custom Office 365 Username is Ready - Order ${customization.order_id}`,
                    html: `
                        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f6f8;">
                            <div style="padding: 32px 20px;">
                                
                                <!-- Header -->
                                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 24px;">
                                    <tr>
                                        <td style="text-align: center;">
                                            <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #DC3E15; letter-spacing: -0.5px;">SimplySolutions</h1>
                                            <p style="margin: 4px 0 0; font-size: 12px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px;">Account Notification</p>
                                        </td>
                                    </tr>
                                </table>

                                <!-- Main Card -->
                                <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);">
                                    
                                    <!-- Banner -->
                                    <div style="background: linear-gradient(135deg, #0078D4, #004E8C); padding: 28px 24px; text-align: center;">
                                        <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #ffffff;">
                                            Your Custom Username is Ready
                                        </h2>
                                        <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 14px; line-height: 1.5;">
                                            Hi ${customization.first_name || 'there'}, your Office 365 account has been updated with your requested username.
                                        </p>
                                    </div>

                                    <div style="padding: 28px 24px;">
                                        
                                        <!-- Order Reference -->
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="background: #f8fafc; border-radius: 8px; padding: 12px 16px; border: 1px solid #e2e8f0;">
                                                    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Order ID</span>
                                                    <br />
                                                    <span style="font-size: 14px; color: #334155; font-weight: 600; font-family: 'Courier New', monospace;">${customization.order_id}</span>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Credentials -->
                                        <div style="border: 2px solid #0078D4; border-radius: 10px; overflow: hidden; margin-bottom: 24px;">
                                            <div style="background: #0078D4; padding: 10px 16px;">
                                                <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff; letter-spacing: 0.3px;">YOUR UPDATED LOGIN CREDENTIALS</h3>
                                            </div>
                                            <div style="padding: 20px 16px;">
                                                <table width="100%" cellpadding="0" cellspacing="0">
                                                    <tr>
                                                        <td style="padding-bottom: 16px;">
                                                            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">New Username</span>
                                                            <br />
                                                            <div style="margin-top: 6px; background: #f0f7ff; padding: 10px 14px; border-radius: 6px; border: 1px solid #dbeafe;">
                                                                <span style="font-size: 16px; color: #0F1111; font-weight: 700; font-family: 'Courier New', monospace;">${generatedEmail}</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                    <tr>
                                                        <td>
                                                            <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; font-weight: 600;">Password</span>
                                                            <br />
                                                            <div style="margin-top: 6px; background: #f8fafc; padding: 10px 14px; border-radius: 6px; border: 1px solid #e2e8f0;">
                                                                <span style="font-size: 14px; color: #475569; font-family: 'Segoe UI', sans-serif;">Same as before (the one you set on your first login)</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </div>

                                        <!-- Login Instructions -->
                                        <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 700; color: #1e293b;">
                                            How to Sign In
                                        </h3>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 20px;">
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                                                <div style="width: 22px; height: 22px; background: #0078D4; border-radius: 50%; text-align: center; line-height: 22px; color: white; font-size: 12px; font-weight: 700;">1</div>
                                                            </td>
                                                            <td style="font-size: 14px; color: #475569; line-height: 1.5;">
                                                                Visit <a href="https://www.office.com" style="color: #0078D4; font-weight: 600; text-decoration: none;">office.com</a> or <a href="https://portal.office.com" style="color: #0078D4; font-weight: 600; text-decoration: none;">portal.office.com</a>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                                                <div style="width: 22px; height: 22px; background: #0078D4; border-radius: 50%; text-align: center; line-height: 22px; color: white; font-size: 12px; font-weight: 700;">2</div>
                                                            </td>
                                                            <td style="font-size: 14px; color: #475569; line-height: 1.5;">
                                                                Sign in with your new username: <strong style="color: #1e293b;">${generatedEmail}</strong>
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td style="padding: 8px 0; vertical-align: top;">
                                                    <table cellpadding="0" cellspacing="0">
                                                        <tr>
                                                            <td style="width: 28px; vertical-align: top; padding-top: 2px;">
                                                                <div style="width: 22px; height: 22px; background: #0078D4; border-radius: 50%; text-align: center; line-height: 22px; color: white; font-size: 12px; font-weight: 700;">3</div>
                                                            </td>
                                                            <td style="font-size: 14px; color: #475569; line-height: 1.5;">
                                                                Enter the password you set during your first login
                                                            </td>
                                                        </tr>
                                                    </table>
                                                </td>
                                            </tr>
                                        </table>

                                        <!-- Notice -->
                                        <div style="background: #fffbeb; border: 1px solid #f59e0b; border-radius: 8px; padding: 14px 16px; margin-bottom: 24px;">
                                            <p style="margin: 0; color: #92400e; font-size: 13px; line-height: 1.6;">
                                                <strong>Please note:</strong> Your password has not changed. Continue using the password you set when you first signed in to your account. If you have not yet changed the default password, we recommend doing so immediately for your security.
                                            </p>
                                        </div>

                                        <!-- CTA -->
                                        <div style="text-align: center; margin-top: 24px;">
                                            <a href="https://www.office.com" 
                                               style="display: inline-block; 
                                                      background: #0078D4; 
                                                      color: #ffffff; 
                                                      padding: 14px 36px; 
                                                      font-size: 15px; 
                                                      font-weight: 600; 
                                                      text-decoration: none; 
                                                      border-radius: 6px;">
                                                Sign in to Microsoft 365
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <!-- Support -->
                                <div style="text-align: center; margin-top: 24px; padding: 20px; background: #ffffff; border-radius: 10px; border: 1px solid #e2e8f0;">
                                    <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                                        Need assistance? We're here to help.
                                    </p>
                                    <a href="https://wa.me/918178848830" 
                                       style="display: inline-block; color: #0078D4; font-weight: 600; font-size: 13px; text-decoration: none;">
                                        Contact Support via WhatsApp
                                    </a>
                                </div>

                                <!-- Footer -->
                                <div style="text-align: center; margin-top: 20px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
                                    <p style="margin: 0; font-size: 11px; color: #94a3b8; line-height: 1.6;">
                                        This is an automated notification from SimplySolutions.<br />
                                        &copy; ${new Date().getFullYear()} SimplySolutions. All rights reserved.
                                    </p>
                                </div>
                            </div>
                        </div>
                    `
                });
            } catch (emailError) {
                console.error('Failed to send customization email:', emailError);
                // Don't fail the request if email fails
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Customization request fulfilled successfully. Customer has been notified.',
            generatedEmail,
            newLicenseKey
        });

    } catch (error) {
        console.error('Admin office365 customization PATCH error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE: Remove a pending customization request
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Get the request first to check status
        const { data: customization, error: fetchError } = await supabase
            .from('office365_customizations')
            .select('id, is_completed')
            .eq('id', id)
            .single();

        if (fetchError || !customization) {
            return NextResponse.json(
                { error: 'Customization request not found' },
                { status: 404 }
            );
        }

        if (customization.is_completed) {
            return NextResponse.json(
                { error: 'Cannot delete a fulfilled request' },
                { status: 400 }
            );
        }

        const { error: deleteError } = await supabase
            .from('office365_customizations')
            .delete()
            .eq('id', id);

        if (deleteError) {
            console.error('Error deleting customization:', deleteError);
            return NextResponse.json(
                { error: 'Failed to delete request' },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: 'Customization request deleted successfully'
        });

    } catch (error) {
        console.error('Admin office365 customization DELETE error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
