import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const fromEmail = 'SimplySolutions <noreply@auth.simplysolutions.co.in>';
const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

interface WarrantyApprovalData {
    customerEmail: string;
    orderId: string;
    productName: string | null;
    quantity: number;
    purchaseDate: string | null;
}

interface WarrantyRejectionData {
    customerEmail: string;
    orderId: string;
    productName: string | null;
    adminNotes: string | null;
}

interface WarrantyResubmissionData {
    customerEmail: string;
    orderId: string;
    productName: string | null;
    missingSeller: boolean;
    missingReview: boolean;
    adminNotes: string | null;
}

export async function sendWarrantyApprovalEmail(data: WarrantyApprovalData): Promise<boolean> {
    try {
        const { customerEmail, orderId, productName, quantity, purchaseDate } = data;

        const formattedDate = purchaseDate
            ? new Date(purchaseDate).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })
            : 'N/A';

        await resend.emails.send({
            from: fromEmail,
            to: customerEmail,
            subject: `✅ Warranty Approved - Order ${orderId}`,
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
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">✅ Warranty Approved!</h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear Customer,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Great news! Your warranty registration has been <strong style="color: #067D62;">successfully verified</strong>. 
                    You are now covered by our Lifetime Warranty.
                </p>
                
                <!-- Order Details Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #0F1111; margin: 0 0 15px; font-size: 16px; border-bottom: 2px solid #067D62; padding-bottom: 10px;">
                                📋 Order Details
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
                                    <td style="color: #666; font-size: 14px;">Quantity:</td>
                                    <td style="color: #0F1111; font-size: 14px; font-weight: bold;">${quantity}</td>
                                </tr>
                                <tr>
                                    <td style="color: #666; font-size: 14px;">Purchase Date:</td>
                                    <td style="color: #0F1111; font-size: 14px; font-weight: bold;">${formattedDate}</td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
                
                <!-- Warranty Benefits Card -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%); border-radius: 8px; border: 2px solid #067D62; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #067D62; margin: 0 0 15px; font-size: 16px;">
                                🛡️ Your Lifetime Warranty Includes:
                            </h3>
                            <ul style="color: #333; font-size: 14px; line-height: 1.8; margin: 0; padding-left: 20px;">
                                <li><strong>Lifetime Technical Support</strong> - Get help anytime via WhatsApp or email</li>
                                <li><strong>Installation Assistance</strong> - Step-by-step guidance for setup</li>
                                <li><strong>License Key Replacement</strong> - Free replacement if key stops working</li>
                                <li><strong>Priority Support</strong> - Faster response times for warranty holders</li>
                            </ul>
                        </td>
                    </tr>
                </table>
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    Your warranty status will be automatically checked during all future support communications. 
                    Keep this email for your records.
                </p>
                
                <!-- Support Contact -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8DC; border-radius: 8px; border-left: 4px solid #FF9900;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Need Help?</strong> Contact us on WhatsApp: <a href="https://wa.me/918595899215" style="color: #067D62; font-weight: bold;">8595899215</a>
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
        console.error('Failed to send warranty approval email:', error);
        return false;
    }
}

export async function sendWarrantyRejectionEmail(data: WarrantyRejectionData): Promise<boolean> {
    try {
        const { customerEmail, orderId, productName, adminNotes } = data;

        await resend.emails.send({
            from: fromEmail,
            to: customerEmail,
            subject: `Warranty Registration Update - Order ${orderId}`,
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
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Warranty Registration Update</h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear Customer,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    We regret to inform you that your warranty registration for <strong>Order ${orderId}</strong> 
                    could not be verified at this time.
                </p>
                
                <!-- Order Info -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FCF4F4; border-left: 4px solid #CC0C39; margin-bottom: 25px; border-radius: 4px;">
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
                
                ${adminNotes ? `
                <!-- Admin Notes -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #0F1111; margin: 0 0 10px; font-size: 14px;">Reason:</h3>
                            <p style="color: #565959; font-size: 14px; line-height: 1.6; margin: 0;">
                                ${adminNotes}
                            </p>
                        </td>
                    </tr>
                </table>
                ` : ''}
                
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin: 0 0 20px;">
                    If you believe this is an error or need assistance, please contact our support team.
                </p>
                
                <!-- Support Contact -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF8DC; border-radius: 8px; border-left: 4px solid #FF9900;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Need Help?</strong> Contact us on WhatsApp: <a href="https://wa.me/918595899215" style="color: #067D62; font-weight: bold;">8595899215</a>
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
        console.error('Failed to send warranty rejection email:', error);
        return false;
    }
}

export async function sendWarrantyResubmissionEmail(data: WarrantyResubmissionData): Promise<boolean> {
    try {
        const { customerEmail, orderId, productName, missingSeller, missingReview, adminNotes } = data;

        // Build reference image URLs from public assets
        const sellerRefImage = `${appUrl}/assets/seller_feedback.png`;
        const reviewRefImage = `${appUrl}/assets/product_review_image.png`;

        let missingItems = [];
        if (missingSeller) missingItems.push('Seller Feedback Screenshot');
        if (missingReview) missingItems.push('Product Review Screenshot');

        await resend.emails.send({
            from: fromEmail,
            to: customerEmail,
            subject: `Action Required: Complete Your Warranty Registration - Order ${orderId}`,
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
            <td style="background: linear-gradient(135deg, #FF9900 0%, #E47911 100%); padding: 30px; text-align: center;">
                <h1 style="color: #ffffff; margin: 0; font-size: 24px;">📸 Additional Screenshot Required</h1>
            </td>
        </tr>
        
        <!-- Main Content -->
        <tr>
            <td style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    Dear Customer,
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                    We are almost ready to verify your warranty for <strong>Order ${orderId}</strong>! 
                    However, we need you to submit the following:
                </p>
                
                <!-- Missing Items -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #FFF4E5; border-left: 4px solid #FF9900; margin-bottom: 25px; border-radius: 4px;">
                    <tr>
                        <td style="padding: 15px;">
                            <h3 style="color: #0F1111; margin: 0 0 10px; font-size: 14px;">⚠️ Missing/Invalid Screenshots:</h3>
                            <ul style="color: #565959; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
                                ${missingItems.map(item => `<li><strong>${item}</strong></li>`).join('')}
                            </ul>
                        </td>
                    </tr>
                </table>
                
                ${adminNotes ? `
                <!-- Admin Notes -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8f9fa; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #565959; font-size: 14px; line-height: 1.6; margin: 0;">
                                <strong>Note from our team:</strong> ${adminNotes}
                            </p>
                        </td>
                    </tr>
                </table>
                ` : ''}
                
                ${missingSeller ? `
                <!-- Seller Feedback Instructions -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #ddd; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #0F1111; margin: 0 0 15px; font-size: 16px;">📋 How to Submit Seller Feedback:</h3>
                            <ol style="color: #565959; font-size: 14px; line-height: 1.8; margin: 0 0 15px; padding-left: 20px;">
                                <li>Go to your Amazon Orders page</li>
                                <li>Find Order ${orderId} and click "Leave Seller Feedback"</li>
                                <li>Rate 5 stars and write a brief comment about your experience</li>
                                <li>Take a screenshot showing your rating and comment</li>
                            </ol>
                            <p style="color: #666; font-size: 12px; margin: 0 0 10px;">Reference example:</p>
                            <img src="${sellerRefImage}" alt="Seller Feedback Example" style="max-width: 100%; border-radius: 4px; border: 1px solid #ddd;">
                        </td>
                    </tr>
                </table>
                ` : ''}
                
                ${missingReview ? `
                <!-- Product Review Instructions -->
                <table width="100%" cellpadding="0" cellspacing="0" style="border: 2px solid #ddd; border-radius: 8px; margin-bottom: 25px;">
                    <tr>
                        <td style="padding: 20px;">
                            <h3 style="color: #0F1111; margin: 0 0 15px; font-size: 16px;">⭐ How to Submit Product Review:</h3>
                            <ol style="color: #565959; font-size: 14px; line-height: 1.8; margin: 0 0 15px; padding-left: 20px;">
                                <li>Go to the product page on Amazon</li>
                                <li>Scroll down and click "Write a customer review"</li>
                                <li>Rate 5 stars, add a headline, and write your review</li>
                                <li>Take a screenshot showing your rating and review</li>
                            </ol>
                            <p style="color: #666; font-size: 12px; margin: 0 0 10px;">Reference example:</p>
                            <img src="${reviewRefImage}" alt="Product Review Example" style="max-width: 100%; border-radius: 4px; border: 1px solid #ddd;">
                        </td>
                    </tr>
                </table>
                ` : ''}
                
                <!-- CTA Button -->
                <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 25px;">
                    <tr>
                        <td style="text-align: center;">
                            <a href="${appUrl}/digital-warranty?orderId=${orderId}" style="display: inline-block; padding: 15px 30px; background: linear-gradient(135deg, #FF9900 0%, #E47911 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
                                Submit Screenshot Now →
                            </a>
                        </td>
                    </tr>
                </table>
                
                <!-- Support Contact -->
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #F0FDF4; border-radius: 8px; border-left: 4px solid #067D62;">
                    <tr>
                        <td style="padding: 15px;">
                            <p style="color: #0F1111; font-size: 14px; margin: 0;">
                                <strong>Need Help?</strong> Contact us on WhatsApp: <a href="https://wa.me/918595899215" style="color: #067D62; font-weight: bold;">8595899215</a>
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
        console.error('Failed to send warranty resubmission email:', error);
        return false;
    }
}
