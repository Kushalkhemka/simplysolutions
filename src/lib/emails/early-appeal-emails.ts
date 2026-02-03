import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'SimplySolutions <noreply@auth.simplysolutions.co.in>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';

interface EarlyAppealApprovalData {
    customerEmail: string;
    orderId: string;
    productName?: string;
}

interface EarlyAppealRejectionData {
    customerEmail: string;
    orderId: string;
    productName?: string;
    reason?: string;
}

export async function sendEarlyAppealApprovalEmail(data: EarlyAppealApprovalData): Promise<boolean> {
    try {
        const { customerEmail, orderId, productName } = data;

        await resend.emails.send({
            from: fromEmail,
            to: customerEmail,
            subject: `Early Activation Approved - Order ${orderId}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #067D62 0%, #0A9A77 100%); padding: 30px; text-align: center;">
                <div style="width: 60px; height: 60px; background-color: rgba(255,255,255,0.2); border-radius: 50%; margin: 0 auto 15px; display: flex; align-items: center; justify-content: center;">
                    <span style="font-size: 30px;">✓</span>
                </div>
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Early Activation Approved!</h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear Customer,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Great news! Your early delivery appeal has been <strong style="color: #067D62;">approved</strong>. 
                    You can now proceed to activate your product.
                </p>
                
                <!-- Order Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #0F1111; margin: 0 0 15px; font-size: 16px; border-bottom: 2px solid #067D62; padding-bottom: 10px;">
                                Order Details
                            </h3>
                            <table width="100%" cellpadding="5">
                                <tr>
                                    <td style="color: #666; font-size: 14px; width: 40%;">Order ID:</td>
                                    <td style="color: #0F1111; font-size: 14px; font-weight: bold;">${orderId}</td>
                                </tr>
                                <tr>
                                    <td style="color: #666; font-size: 14px;">Product:</td>
                                    <td style="color: #0F1111; font-size: 14px; font-weight: bold;">${productName || 'Software License'}</td>
                                </tr>
                                <tr>
                                    <td style="color: #666; font-size: 14px;">Status:</td>
                                    <td style="color: #067D62; font-size: 14px; font-weight: bold;">Ready to Activate</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="${appUrl}/activate?code=${orderId}" style="display: inline-block; padding: 15px 40px; background: linear-gradient(135deg, #FFD814 0%, #F7CA00 100%); color: #0F1111; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; border: 1px solid #FCD200;">
                                Activate Your Product Now →
                            </a>
                        </td>
                    </tr>
                </table>
                
                <!-- Next Steps -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border-radius: 8px; border: 2px solid #067D62; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #067D62; margin: 0 0 15px; font-size: 16px;">
                                Next Steps:
                            </h3>
                            <ol style="color: #333; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                <li>Click the button above or visit ${appUrl}/activate</li>
                                <li>Enter your Order ID: <strong>${orderId}</strong></li>
                                <li>Follow the on-screen instructions to activate</li>
                                <li>Save your license key in a safe place</li>
                            </ol>
                        </td>
                    </tr>
                </table>
                
                <!-- Support Contact -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8DC; border-radius: 8px; border-left: 4px solid #FF9900;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Need Help?</strong> Contact us on WhatsApp: <a href="https://wa.me/918178848830" style="color: #067D62; font-weight: bold;">8178848830</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #0F1111; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2026 SimplySolutions. All rights reserved.<br>
                    <a href="${appUrl}" style="color: #FF9900;">www.simplysolutions.co.in</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        });
        return true;
    } catch (error) {
        console.error('Failed to send early appeal approval email:', error);
        return false;
    }
}

export async function sendEarlyAppealRejectionEmail(data: EarlyAppealRejectionData): Promise<boolean> {
    try {
        const { customerEmail, orderId, productName, reason } = data;

        await resend.emails.send({
            from: fromEmail,
            to: customerEmail,
            subject: `Early Activation Update - Order ${orderId}`,
            html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; background-color: #f5f5f5;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
        <!-- Header -->
        <tr>
            <td style="background: linear-gradient(135deg, #CC0C39 0%, #A00F28 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Early Activation Update</h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear Customer,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    We regret to inform you that your early delivery appeal for <strong>Order ${orderId}</strong> 
                    could not be approved at this time.
                </p>
                
                <!-- Order Info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0 0 10px;">
                                <strong>Order ID:</strong> ${orderId}
                            </p>
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Product:</strong> ${productName || 'Software License'}
                            </p>
                        </td>
                    </tr>
                </table>
                
                ${reason ? `
                <!-- Reason -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF4F4; border-left: 4px solid #CC0C39; margin-bottom: 25px; border-radius: 4px;">
                    <tr>
                        <td style="padding: 15px;">
                            <h3 style="color: #0F1111; margin: 0 0 10px; font-size: 14px;">Reason:</h3>
                            <p style="color: #565959; font-size: 14px; line-height: 1.6; margin: 0;">
                                ${reason}
                            </p>
                        </td>
                    </tr>
                </table>
                ` : ''}
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    Don't worry! Your activation will be available automatically once the standard delivery period has passed.
                    If you believe this is an error, please contact our support team with additional proof of delivery.
                </p>
                
                <!-- Support Contact -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8DC; border-radius: 8px; border-left: 4px solid #FF9900;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Need Help?</strong> Contact us on WhatsApp: <a href="https://wa.me/918178848830" style="color: #067D62; font-weight: bold;">8178848830</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
        
        <!-- Footer -->
        <tr>
            <td style="background-color: #0F1111; padding: 20px; text-align: center;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                    © 2026 SimplySolutions. All rights reserved.<br>
                    <a href="${appUrl}" style="color: #FF9900;">www.simplysolutions.co.in</a>
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
            `
        });
        return true;
    } catch (error) {
        console.error('Failed to send early appeal rejection email:', error);
        return false;
    }
}
