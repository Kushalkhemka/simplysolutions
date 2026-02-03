import { getSubscriptionConfig, SUBSCRIPTION_INSTRUCTIONS } from '../amazon/subscription-products';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

interface OrderConfirmationData {
  to: string;
  orderNumber: string;
  customerName: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    licenseKeys?: string[];
  }>;
  total: number;
}

export async function sendOrderConfirmation(data: OrderConfirmationData) {
  const itemsHtml = data.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price.toFixed(2)}</td>
    </tr>
    ${item.licenseKeys ? `
      <tr>
        <td colspan="3" style="padding: 10px; background: #f9f9f9;">
          <strong>License Key(s):</strong><br/>
          ${item.licenseKeys.map(key => `<code style="background: #e0e0e0; padding: 2px 6px; display: block; margin: 5px 0;">${key}</code>`).join('')}
        </td>
      </tr>
    ` : ''}
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin: 0;">SimplySolutions</h1>
        <p style="color: #666;">Order Confirmation</p>
      </div>
      
      <p>Dear ${data.customerName},</p>
      
      <p>Thank you for your order! Your payment has been confirmed and your license keys are ready.</p>
      
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Order Number:</strong> ${data.orderNumber}
      </div>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background: #2563eb; color: white;">
            <th style="padding: 10px; text-align: left;">Product</th>
            <th style="padding: 10px; text-align: center;">Qty</th>
            <th style="padding: 10px; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr style="background: #f3f4f6; font-weight: bold;">
            <td colspan="2" style="padding: 10px;">Total</td>
            <td style="padding: 10px; text-align: right;">₹${data.total.toFixed(2)}</td>
          </tr>
        </tfoot>
      </table>
      
      <div style="background: #fef3c7; border: 1px solid #fcd34d; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong>Important:</strong> Please save your license keys in a safe place. You can also view them anytime in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders">order history</a>.
      </div>
      
      <p>If you have any questions, please contact our support team.</p>
      
      <p style="color: #666; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
        © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
      </p>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: `Order Confirmed - ${data.orderNumber}`,
      html,
    });

    if (error) {
      console.error('Email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Email service error:', error);
    return { success: false, error };
  }
}

interface VerificationEmailData {
  to: string;
  customerName: string;
  verificationUrl: string;
}

export async function sendVerificationEmail(data: VerificationEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Logo/Header -->
        <div style="text-align: center; margin-bottom: 32px;">
           <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #DC3E15; letter-spacing: -1px;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05); text-align: center; border: 1px solid #e2e8f0;">
          
          <!-- Icon -->
          <div style="width: 64px; height: 64px; margin: 0 auto 24px; background-color: #FFF7ED; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #FFEDD5;">
            <span style="font-size: 32px; line-height: 1; color: #DC3E15;">&#9993;</span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1e293b;">Verify your email</h2>
          
          <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; line-height: 1.6;">
            Hi <strong>${data.customerName}</strong>,<br>
            Thanks for creating an account! Please verify your email address to continue.
          </p>

          <!-- Primary Button -->
          <a href="${data.verificationUrl}" 
             style="display: inline-block; 
                    background-color: #DC3E15; 
                    color: #ffffff; 
                    padding: 16px 32px; 
                    font-size: 16px; 
                    font-weight: 600; 
                    text-decoration: none; 
                    border-radius: 100px;
                    box-shadow: 0 4px 12px rgba(220, 62, 21, 0.25);">
            Verify Email Address
          </a>

          <!-- Divider -->
          <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>

          <!-- Link fallback -->
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">
            Button not working? Copy and paste this link:
          </p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: left; overflow-wrap: break-word; word-break: break-all; border: 1px solid #e2e8f0;">
            <a href="${data.verificationUrl}" style="color: #DC3E15; font-size: 13px; font-family: monospace; text-decoration: none; display: block;">
              ${data.verificationUrl}
            </a>
          </div>

          <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">
            Link expires in 24 hours.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: 'Verify your email - SimplySolutions',
      html,
    });

    if (error) {
      console.error('Verification email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Verification email service error:', error);
    return { success: false, error };
  }
}

interface PasswordResetEmailData {
  to: string;
  customerName: string;
  resetUrl: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Logo/Header -->
        <div style="text-align: center; margin-bottom: 32px;">
           <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #DC3E15; letter-spacing: -1px;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05); text-align: center; border: 1px solid #e2e8f0;">
          
          <!-- Icon -->
          <div style="width: 64px; height: 64px; margin: 0 auto 24px; background-color: #FFF7ED; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid #FFEDD5;">
            <span style="font-size: 32px; line-height: 1; color: #DC3E15;">&#128274;</span>
          </div>

          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1e293b;">Reset Password</h2>
          
          <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; line-height: 1.6;">
            Hi <strong>${data.customerName}</strong>,<br>
            We received a request to reset your password. Click the button below to choose a new one.
          </p>

          <!-- Primary Button -->
          <a href="${data.resetUrl}" 
             style="display: inline-block; 
                    background-color: #DC3E15; 
                    color: #ffffff; 
                    padding: 16px 32px; 
                    font-size: 16px; 
                    font-weight: 600; 
                    text-decoration: none; 
                    border-radius: 100px;
                    box-shadow: 0 4px 12px rgba(220, 62, 21, 0.25);">
            Reset Password
          </a>

          <!-- Divider -->
          <div style="margin: 32px 0; border-top: 1px solid #e2e8f0;"></div>

          <!-- Link fallback -->
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">
            Button not working? Copy and paste this link:
          </p>
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 12px; text-align: left; overflow-wrap: break-word; word-break: break-all; border: 1px solid #e2e8f0;">
            <a href="${data.resetUrl}" style="color: #DC3E15; font-size: 13px; font-family: monospace; text-decoration: none; display: block;">
              ${data.resetUrl}
            </a>
          </div>

          <p style="margin: 24px 0 0; font-size: 13px; color: #94a3b8;">
            Link expires in 1 hour.
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: 'Reset your password - SimplySolutions',
      html,
    });

    if (error) {
      console.error('Password reset email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Password reset email service error:', error);
    return { success: false, error };
  }
}


export interface SubscriptionEmailData {
  to: string;
  customerName?: string;
  orderId: string;
  fsn: string;
  subscriptionEmail?: string; // Email where subscription was processed (if different)
}

export async function sendSubscriptionEmail(data: SubscriptionEmailData) {
  const config = getSubscriptionConfig(data.fsn);

  if (!config) {
    return { success: false, error: 'Unknown subscription product' };
  }

  const subscriptionEmail = data.subscriptionEmail || data.to;
  const customerName = data.customerName || 'Customer';

  const stepsHtml = config.steps.map((step, i) => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
        <div style="display: flex; align-items: flex-start; gap: 12px;">
          <div style="width: 28px; height: 28px; background: linear-gradient(135deg, #DC3E15, #f97316); border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
            <span style="color: white; font-weight: 700; font-size: 14px;">${i + 1}</span>
          </div>
          <span style="color: #334155; font-size: 15px; line-height: 1.6; padding-top: 2px;">${step}</span>
        </div>
      </td>
    </tr>
  `).join('');

  const afterInstallHtml = config.afterInstall ? `
    <div style="margin-top: 24px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 12px; padding: 20px;">
      <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 600; color: #92400e;">
        After Installation
      </h3>
      <ul style="margin: 0; padding-left: 20px; color: #92400e;">
        ${config.afterInstall.map(step => `<li style="margin-bottom: 8px;">${step}</li>`).join('')}
      </ul>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Subscription Activated</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Logo/Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 32px; font-weight: 800; color: #DC3E15; letter-spacing: -1px;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Success Icon -->
          <div style="text-align: center; margin-bottom: 24px;">
            <div style="width: 80px; height: 80px; margin: 0 auto; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 40px; line-height: 1; color: white;">&#10003;</span>
            </div>
          </div>

          <h2 style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center;">
            Subscription Activated!
          </h2>
          
          <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; text-align: center;">
            Your ${config.productName} has been successfully processed
          </p>

          <!-- Order Details -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
            <table style="width: 100%;">
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Order ID:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right; font-family: monospace;">${data.orderId}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Product:</td>
                <td style="padding: 8px 0; color: #1e293b; font-weight: 600; text-align: right;">${config.productName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #64748b; font-size: 14px;">Subscription Email:</td>
                <td style="padding: 8px 0; color: #DC3E15; font-weight: 600; text-align: right;">${subscriptionEmail}</td>
              </tr>
            </table>
          </div>

          <!-- Installation Steps -->
          <h3 style="margin: 0 0 16px; font-size: 18px; font-weight: 600; color: #1e293b;">
            Installation Steps
          </h3>
          
          <table style="width: 100%;">
            ${stepsHtml}
          </table>

          ${afterInstallHtml}

          <!-- Download Button -->
          <div style="text-align: center; margin-top: 32px;">
            <a href="${config.downloadUrl}" 
               style="display: inline-block; 
                      background: linear-gradient(135deg, #DC3E15, #f97316); 
                      color: #ffffff; 
                      padding: 16px 40px; 
                      font-size: 16px; 
                      font-weight: 600; 
                      text-decoration: none; 
                      border-radius: 100px;
                      box-shadow: 0 4px 16px rgba(220, 62, 21, 0.3);">
              Go to Download Portal →
            </a>
          </div>
        </div>

        <!-- Support Card -->
        <div style="background-color: #ffffff; border-radius: 12px; padding: 24px; margin-top: 24px; border: 1px solid #e2e8f0; text-align: center;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">
            Need help with installation?
          </p>
          <a href="https://wa.me/918178848830" 
             style="display: inline-flex; align-items: center; gap: 8px; background: #25D366; color: white; padding: 12px 24px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 14px;">
            <span></span>Chat on WhatsApp
          </a>
          <p style="margin: 12px 0 0; font-size: 13px; color: #94a3b8;">
            +91 8178848830 (Message only)
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: `Your ${config.productName} is Ready! - Order ${data.orderId}`,
      html,
    });

    if (error) {
      console.error('Subscription email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Subscription email service error:', error);
    return { success: false, error };
  }
}

// Microsoft 365 Enterprise Email with Credentials
export interface Enterprise365EmailData {
  to: string;
  orderId: string;
  firstName: string;
  generatedEmail: string;
  generatedPassword: string;
}

export async function send365EnterpriseEmail(data: Enterprise365EmailData) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #DC3E15;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
          
          <!-- Success Banner -->
          <div style="background: linear-gradient(135deg, #0078D4, #005A9E); padding: 24px; text-align: center;">
            <div style="width: 64px; height: 64px; margin: 0 auto 16px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
              <span style="font-size: 32px; color: white;">✓</span>
            </div>
            <h2 style="margin: 0; font-size: 22px; font-weight: 700; color: white;">
              Your Microsoft 365 Account is Ready!
            </h2>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Hi ${data.firstName}, your account has been created successfully
            </p>
          </div>

          <div style="padding: 32px;">
            <!-- Order Info -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 13px; color: #64748b;">Order ID</p>
              <p style="margin: 4px 0 0; font-size: 15px; color: #1e293b; font-weight: 600; font-family: monospace;">${data.orderId}</p>
            </div>

            <!-- Credentials Box -->
            <div style="background: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 700; color: #1e40af;">
                Your Login Credentials
              </h3>
              
              <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Email / Username</p>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dbeafe;">
                  <code style="font-size: 16px; color: #1e293b; font-weight: 600; font-family: 'Courier New', monospace;">${data.generatedEmail}</code>
                </div>
              </div>
              
              <div>
                <p style="margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b; font-weight: 600;">Temporary Password</p>
                <div style="background: white; padding: 12px; border-radius: 6px; border: 1px solid #dbeafe;">
                  <code style="font-size: 16px; color: #1e293b; font-weight: 600; font-family: 'Courier New', monospace;">${data.generatedPassword}</code>
                </div>
              </div>
            </div>

            <!-- Instructions -->
            <h3 style="margin: 0 0 16px; font-size: 16px; font-weight: 600; color: #1e293b;">
              Getting Started
            </h3>
            
            <ol style="margin: 0; padding-left: 20px; color: #475569;">
              <li style="margin-bottom: 12px;">Go to <a href="https://www.office.com" style="color: #0078D4; font-weight: 600;">office.com</a></li>
              <li style="margin-bottom: 12px;">Sign in with the credentials above</li>
              <li style="margin-bottom: 12px;"><strong style="color: #dc2626;">Change your password immediately</strong> for security</li>
              <li style="margin-bottom: 12px;">Enable Two-Factor Authentication (2FA)</li>
            </ol>

            <!-- Guide Link -->
            <div style="margin-top: 24px; background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #0369a1; font-size: 14px;">
                <strong>Need detailed instructions?</strong><br>
                <a href="https://simplysolutions.co.in/office365" style="color: #0078D4; font-weight: 600;">View our complete setup guide →</a>
              </p>
            </div>

            <!-- Warning -->
            <div style="margin-top: 16px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px;">
              <p style="margin: 0; color: #92400e; font-size: 14px;">
                <strong>Important:</strong> Please change your password on first login and keep your credentials secure. Do not share them with anyone.
              </p>
            </div>

            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://www.office.com" 
                 style="display: inline-block; 
                        background: linear-gradient(135deg, #0078D4, #005A9E); 
                        color: #ffffff; 
                        padding: 16px 40px; 
                        font-size: 16px; 
                        font-weight: 600; 
                        text-decoration: none; 
                        border-radius: 100px;
                        box-shadow: 0 4px 16px rgba(0, 120, 212, 0.3);">
                Login to Microsoft 365
              </a>
            </div>
          </div>
        </div>

        <!-- Support -->
        <div style="text-align: center; margin-top: 32px; padding: 24px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">
            Need help? Contact us on WhatsApp
          </p>
          <a href="https://wa.me/918178848830" 
             style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 14px;">
            Chat on WhatsApp
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: `Your Microsoft 365 Account is Ready - Order ${data.orderId}`,
      html,
    });

    if (error) {
      console.error('365 Enterprise email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('365 Enterprise email service error:', error);
    return { success: false, error };
  }
}

// Digital Delivery Email with Secret Codes
export interface DigitalProductDelivery {
  productName: string;
  secretCode: string;
  installationGuideUrl: string | null;
}

export interface DigitalDeliveryEmailData {
  to: string;
  customerName: string;
  orderNumber: string;
  products: DigitalProductDelivery[];
}

export async function sendDigitalDeliveryEmail(data: DigitalDeliveryEmailData) {
  const activateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}/activate`;

  // Generate HTML for each product's secret code
  const productsHtml = data.products.map((product, index) => `
    <div style="margin-bottom: ${index < data.products.length - 1 ? '28px' : '0'}; padding-bottom: ${index < data.products.length - 1 ? '28px' : '0'}; border-bottom: ${index < data.products.length - 1 ? '1px solid #e2e8f0' : 'none'};">
      <h3 style="margin: 0 0 12px; font-size: 15px; font-weight: 600; color: #1e293b;">
        ${product.productName}
      </h3>
      
      <!-- Secret Code Box -->
      <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 16px; margin-bottom: 12px;">
        <p style="margin: 0 0 8px; font-size: 11px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; text-align: center;">
          Your Activation Code
        </p>
        <div style="background: white; padding: 12px 16px; border-radius: 8px; border: 1px solid #fcd34d; text-align: center;">
          <code style="font-size: 20px; font-weight: 700; letter-spacing: 2px; color: #1e293b; font-family: 'Courier New', Consolas, monospace;">
            ${product.secretCode}
          </code>
        </div>
      </div>

      <!-- Activate Button for this specific product -->
      <div style="text-align: center; margin-bottom: ${product.installationGuideUrl ? '12px' : '0'};">
        <a href="${activateUrl}?code=${product.secretCode}" 
           style="display: inline-block; 
                  background: linear-gradient(135deg, #d97706, #f59e0b); 
                  color: #ffffff; 
                  padding: 12px 28px; 
                  font-size: 14px; 
                  font-weight: 600; 
                  text-decoration: none; 
                  border-radius: 6px;
                  box-shadow: 0 2px 8px rgba(217, 119, 6, 0.25);">
          Activate This Product Now
        </a>
      </div>

      ${product.installationGuideUrl ? `
      <!-- Installation Guide Link -->
      <div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 12px; text-align: center;">
        <a href="${product.installationGuideUrl}" 
           style="color: #0369a1; font-weight: 600; font-size: 13px; text-decoration: none;">
          View Installation Guide →
        </a>
      </div>
      ` : ''}
    </div>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f1f5f9;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #DC3E15;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08);">
          
          <!-- Success Banner -->
          <div style="background: linear-gradient(135deg, #059669, #10b981); padding: 28px; text-align: center;">
            <div style="width: 56px; height: 56px; margin: 0 auto 14px; background: rgba(255,255,255,0.2); border-radius: 50%; line-height: 56px;">
              <span style="font-size: 28px; color: white;">&#10003;</span>
            </div>
            <h2 style="margin: 0; font-size: 20px; font-weight: 600; color: white;">
              Payment Successful!
            </h2>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Your Order Has Been Confirmed
            </p>
          </div>

          <div style="padding: 32px;">
            <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
              Hi <strong>${data.customerName}</strong>,<br>
              Thank you for your purchase! Your payment has been confirmed and your digital products are ready.
            </p>

            <!-- Order Number -->
            <div style="background: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 28px; border: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #64748b;">Order Number</p>
              <p style="margin: 4px 0 0; font-size: 15px; color: #1e293b; font-weight: 600; font-family: monospace;">${data.orderNumber}</p>
            </div>

            <!-- Products Section -->
            <div style="margin-bottom: 28px;">
              ${productsHtml}
            </div>

            <!-- How to Activate -->
            <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 600; color: #1e293b;">
              How to Activate Your Products
            </h3>
            
            <ol style="margin: 0 0 24px; padding-left: 18px; color: #475569; line-height: 1.9; font-size: 14px;">
              <li>Visit our activation page using the button below</li>
              <li>Enter your 15-digit secret code</li>
              <li>Click "Verify & Generate" to receive your license key</li>
              <li>Follow the installation guide for your specific product</li>
            </ol>

            <!-- CTA Button -->
            <div style="text-align: center;">
              <a href="${activateUrl}" 
                 style="display: inline-block; 
                        background: #1e293b; 
                        color: #ffffff; 
                        padding: 14px 36px; 
                        font-size: 15px; 
                        font-weight: 600; 
                        text-decoration: none; 
                        border-radius: 8px;">
                Activate Your Products Now
              </a>
            </div>

            <!-- Important Notice -->
            <div style="margin-top: 24px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: 600;">
                📌 Important Reminder
              </p>
              <p style="margin: 0; color: #78716c; font-size: 13px; line-height: 1.6;">
                Please save your secret codes securely. You can also access them anytime from your <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}/dashboard/orders" style="color: #DC3E15; text-decoration: underline;">order history</a>.
              </p>
            </div>
          </div>
        </div>

        <!-- Support -->
        <div style="text-align: center; margin-top: 28px; padding: 20px; background: white; border-radius: 10px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 10px; font-size: 13px; color: #64748b;">
            Need help? Contact us on WhatsApp
          </p>
          <a href="https://wa.me/918178848830" 
             style="display: inline-block; background: #25D366; color: white; padding: 10px 20px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 13px;">
            Chat on WhatsApp
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="margin: 0; font-size: 12px; color: #94a3b8;">
            &copy; ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: `Your Digital Products Are Ready! - Order ${data.orderNumber}`,
      html,
    });

    if (error) {
      console.error('Digital delivery email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Digital delivery email service error:', error);
    return { success: false, error };
  }
}

// Review Request Email - sent 3 days after activation
export interface ReviewRequestEmailData {
  to: string;
  customerName: string;
  orderId: string;
  productName: string;
}

export async function sendReviewRequestEmail(data: ReviewRequestEmailData) {
  const warrantyUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}/warranty?orderId=${data.orderId}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #DC3E15;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
          
          <!-- Gradient Header with Stars -->
          <div style="background: linear-gradient(135deg, #1e293b, #334155); padding: 32px; text-align: center;">
            <div style="font-size: 36px; margin-bottom: 12px;">⭐⭐⭐⭐⭐</div>
            <h2 style="margin: 0; font-size: 24px; font-weight: 700; color: white;">
              How was your experience?
            </h2>
            <p style="margin: 8px 0 0; color: rgba(255,255,255,0.8); font-size: 14px;">
              Your feedback helps us improve
            </p>
          </div>

          <div style="padding: 32px;">
            <!-- Order Info -->
            <div style="background: #f8fafc; border-radius: 10px; padding: 16px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
              <table style="width: 100%;">
                <tr>
                  <td style="padding: 0;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Order ID</p>
                    <p style="margin: 4px 0 0; font-size: 16px; color: #1e293b; font-weight: 700; font-family: monospace;">${data.orderId}</p>
                  </td>
                  <td style="padding: 0; text-align: right;">
                    <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px;">Product</p>
                    <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b; font-weight: 600;">${data.productName}</p>
                  </td>
                </tr>
              </table>
            </div>

            <!-- Greeting -->
            <p style="margin: 0 0 20px; font-size: 16px; color: #475569; line-height: 1.6;">
              Hi <strong>${data.customerName}</strong>,<br>
              We hope you're enjoying your purchase! Your honest feedback means the world to us.
            </p>

            <!-- Benefits Box -->
            <div style="background: linear-gradient(135deg, #ecfdf5, #d1fae5); border: 1px solid #10b981; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
              <h3 style="margin: 0 0 12px; font-size: 16px; font-weight: 700; color: #047857;">
                🎁 Why Leave a Review?
              </h3>
              <ul style="margin: 0; padding-left: 18px; color: #065f46; font-size: 14px; line-height: 1.8;">
                <li><strong>Get Lifetime Warranty</strong> - Reviews help you qualify for our warranty program</li>
                <li><strong>Help Others</strong> - Your experience guides future customers</li>
                <li><strong>Support Quality</strong> - Feedback helps us serve you better</li>
              </ul>
            </div>

            <!-- Amazon Review CTA -->
            <div style="text-align: center; margin: 28px 0;">
              <p style="margin: 0 0 16px; font-size: 15px; color: #64748b;">
                If you purchased from Amazon, please leave a 5-star review:
              </p>
              <a href="https://www.amazon.in/review/create-review" 
                 style="display: inline-block; 
                        background: linear-gradient(135deg, #FF9900, #FFB84D); 
                        color: #1e293b; 
                        padding: 16px 48px; 
                        font-size: 16px; 
                        font-weight: 700; 
                        text-decoration: none; 
                        border-radius: 8px;
                        box-shadow: 0 4px 16px rgba(255, 153, 0, 0.4);">
                ⭐ Leave a Review on Amazon
              </a>
            </div>

            <!-- Divider -->
            <div style="margin: 28px 0; border-top: 2px solid #e2e8f0;"></div>

            <!-- Warranty Registration CTA -->
            <div style="background: linear-gradient(135deg, #fef3c7, #fde68a); border: 1px solid #f59e0b; border-radius: 12px; padding: 20px; text-align: center;">
              <h3 style="margin: 0 0 8px; font-size: 16px; font-weight: 700; color: #92400e;">
                🛡️ Register for Lifetime Warranty
              </h3>
              <p style="margin: 0 0 16px; font-size: 14px; color: #78350f;">
                Complete your warranty registration to get lifetime support & free replacements
              </p>
              <a href="${warrantyUrl}" 
                 style="display: inline-block; 
                        background: linear-gradient(135deg, #DC3E15, #f97316); 
                        color: #ffffff; 
                        padding: 14px 32px; 
                        font-size: 15px; 
                        font-weight: 600; 
                        text-decoration: none; 
                        border-radius: 8px;
                        box-shadow: 0 4px 12px rgba(220, 62, 21, 0.3);">
                Register for Warranty →
              </a>
            </div>
          </div>
        </div>

        <!-- Support Section -->
        <div style="text-align: center; margin-top: 24px; padding: 20px; background: white; border-radius: 12px; border: 1px solid #e2e8f0;">
          <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">
            Having any issues with your product?
          </p>
          <a href="https://wa.me/918178848830" 
             style="display: inline-block; background: #25D366; color: white; padding: 10px 24px; border-radius: 100px; text-decoration: none; font-weight: 600; font-size: 14px;">
            💬 Contact Support on WhatsApp
          </a>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 24px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">
            You received this email because you made a purchase from SimplySolutions.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: `⭐ Share Your Feedback - Order ${data.orderId}`,
      html,
    });

    if (error) {
      console.error('Review request email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Review request email service error:', error);
    return { success: false, error };
  }
}

// Customer Re-engagement Email - sent to customers who haven't ordered in 30+ days
export interface ReEngagementEmailData {
  to: string;
  customerName: string;
  lastOrderDate: string;
  daysSinceOrder: number;
  couponCode?: string;
  discountPercent?: number;
}

export async function sendReEngagementEmail(data: ReEngagementEmailData) {
  const shopUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';
  const discountText = data.couponCode && data.discountPercent
    ? `Use code < strong > ${data.couponCode} </strong> for ${data.discountPercent}% off!`
    : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
      <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #DC3E15;">SimplySolutions</h1>
        </div>

        <!-- Main Card -->
        <div style="background-color: #ffffff; border-radius: 16px; padding: 40px; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
          
          <!-- Greeting -->
          <h2 style="margin: 0 0 16px; font-size: 24px; font-weight: 700; color: #1e293b; text-align: center;">
            We miss you, ${data.customerName}!
          </h2>
          
          <p style="margin: 0 0 24px; font-size: 16px; color: #64748b; text-align: center; line-height: 1.6;">
            It's been ${data.daysSinceOrder} days since your last order. We've got some amazing deals waiting for you!
          </p>

          ${data.couponCode ? `
          <!-- Coupon Box -->
          <div style="background: linear-gradient(135deg, #DC3E15, #f97316); border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
            <p style="margin: 0 0 8px; font-size: 14px; color: rgba(255,255,255,0.9);">
              Exclusive offer just for you
            </p>
            <p style="margin: 0 0 12px; font-size: 32px; font-weight: 800; color: white; letter-spacing: 2px;">
              ${data.discountPercent}% OFF
            </p>
            <div style="background: white; padding: 12px 24px; border-radius: 8px; display: inline-block;">
              <code style="font-size: 20px; font-weight: 700; color: #DC3E15; letter-spacing: 2px;">${data.couponCode}</code>
            </div>
          </div>
          ` : ''}

          <!-- CTA Button -->
          <div style="text-align: center; margin: 32px 0;">
            <a href="${shopUrl}/products" 
               style="display: inline-block; 
                      background: #1e293b; 
                      color: #ffffff; 
                      padding: 16px 40px; 
                      font-size: 16px; 
                      font-weight: 600; 
                      text-decoration: none; 
                      border-radius: 8px;
                      box-shadow: 0 4px 12px rgba(0,0,0,0.15);">
              Browse Our Latest Products
            </a>
          </div>

          <!-- Featured Products Hint -->
          <div style="background: #f8fafc; border-radius: 12px; padding: 20px; text-align: center; border: 1px solid #e2e8f0;">
            <p style="margin: 0 0 8px; font-size: 14px; font-weight: 600; color: #1e293b;">
              Popular right now:
            </p>
            <p style="margin: 0; font-size: 14px; color: #64748b;">
              Microsoft Office 2024 • Windows 11 Pro • Adobe Creative Cloud
            </p>
          </div>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 32px;">
          <p style="margin: 0; font-size: 13px; color: #94a3b8;">
            © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
          </p>
          <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">
            You received this email because you're a valued SimplySolutions customer.<br>
            <a href="${shopUrl}/unsubscribe" style="color: #94a3b8;">Unsubscribe</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: data.couponCode
        ? `${data.customerName}, here's ${data.discountPercent}% off just for you!`
        : `We miss you, ${data.customerName}! Come back to SimplySolutions`,
      html,
    });

    if (error) {
      console.error('Re-engagement email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Re-engagement email service error:', error);
    return { success: false, error };
  }
}

// Warranty Resubmission Reminder Email - sent every 2 days to customers who need to resubmit screenshots
export interface WarrantyReminderEmailData {
  to: string;
  customerName: string;
  orderId: string;
  productName?: string;
  missingSeller: boolean;
  missingReview: boolean;
  reminderNumber?: number;  // Which reminder this is (1, 2, or 3)
  maxReminders?: number;    // Maximum reminders to send (default 3)
}

export async function sendWarrantyResubmissionReminder(data: WarrantyReminderEmailData) {
  const shopUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in';
  const warrantyUrl = `${shopUrl}/warranty?orderId=${data.orderId}`;

  const missingItems: string[] = [];
  if (data.missingSeller) missingItems.push('Seller Feedback Screenshot');
  if (data.missingReview) missingItems.push('Product Review Screenshot');

  // Determine urgency level based on reminder number
  const reminderNumber = data.reminderNumber || 1;
  const maxReminders = data.maxReminders || 3;

  // Urgency styling based on reminder number
  let headerBg = '#1e293b';
  let headerTitle = 'Complete Your Warranty Registration';
  let headerSubtitle = 'Action required to activate your lifetime protection';
  let subjectLine = `Action Required: Complete Your Warranty - Order ${data.orderId}`;

  if (reminderNumber === 2) {
    headerBg = '#ea580c';
    headerTitle = 'Second Reminder';
    headerSubtitle = 'Your warranty registration is still pending';
    subjectLine = `Second Reminder: Order ${data.orderId} Warranty Pending`;
  } else if (reminderNumber >= 3) {
    headerBg = '#dc2626';
    headerTitle = 'Final Reminder';
    headerSubtitle = 'Last opportunity to complete your warranty registration';
    subjectLine = `Final Reminder: Order ${data.orderId} - Warranty Registration`;
  }

  // Generate missing items HTML
  const missingItemsHtml = missingItems.map((item, index) => `
    <tr>
      <td style="padding: 12px 16px; border-bottom: 1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td width="32" style="vertical-align: middle;">
              <div style="width: 8px; height: 8px; background: #ef4444; border-radius: 50%; margin-left: 8px;"></div>
            </td>
            <td style="font-size: 15px; color: #1e293b; font-weight: 500; padding-left: 12px;">${item}</td>
            <td width="80" style="text-align: right; color: #ef4444; font-size: 12px; font-weight: 600;">PENDING</td>
          </tr>
        </table>
      </td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta name="color-scheme" content="light">
      <meta name="supported-color-schemes" content="light">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f1f5f9;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f1f5f9;">
        <tr>
          <td align="center" style="padding: 40px 20px;">
            <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; width: 100%;">
              
              <!-- Logo Header -->
              <tr>
                <td style="text-align: center; padding-bottom: 24px;">
                  <span style="font-size: 28px; font-weight: 800; color: #DC3E15; letter-spacing: -0.5px;">SimplySolutions</span>
                </td>
              </tr>

              <!-- Main Card -->
              <tr>
                <td>
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);">
                    
                    <!-- Header Banner -->
                    <tr>
                      <td style="background: ${headerBg}; padding: 32px 40px; text-align: center;">
                        <h1 style="margin: 0; font-size: 26px; font-weight: 700; color: #ffffff; letter-spacing: -0.5px;">${headerTitle}</h1>
                        <p style="margin: 12px 0 0; font-size: 15px; color: rgba(255,255,255,0.85);">${headerSubtitle}</p>
                      </td>
                    </tr>

                    <!-- Order Info Card -->
                    <tr>
                      <td style="padding: 32px 40px 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
                          <tr>
                            <td style="padding: 20px;">
                              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td>
                                    <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Order ID</p>
                                    <p style="margin: 4px 0 0; font-size: 18px; color: #1e293b; font-weight: 700; font-family: 'SF Mono', Monaco, 'Courier New', monospace;">${data.orderId}</p>
                                  </td>
                                  <td style="text-align: right;">
                                    <p style="margin: 0; font-size: 11px; color: #64748b; text-transform: uppercase; letter-spacing: 1px; font-weight: 600;">Product</p>
                                    <p style="margin: 4px 0 0; font-size: 14px; color: #1e293b; font-weight: 600;">${data.productName || 'Your Product'}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Greeting -->
                    <tr>
                      <td style="padding: 0 40px 24px;">
                        <p style="margin: 0; font-size: 16px; color: #475569; line-height: 1.6;">
                          Hi <strong style="color: #1e293b;">${data.customerName}</strong>,<br><br>
                          Your warranty registration is almost complete! We just need the following to activate your <strong>lifetime warranty</strong>:
                        </p>
                      </td>
                    </tr>

                    <!-- Missing Items Table -->
                    <tr>
                      <td style="padding: 0 40px 24px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 12px; border: 2px solid #fecaca; overflow: hidden;">
                          <tr>
                            <td style="background: #fef2f2; padding: 12px 16px; border-bottom: 2px solid #fecaca;">
                              <p style="margin: 0; font-size: 13px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.5px;">Missing Documents</p>
                            </td>
                          </tr>
                          ${missingItemsHtml}
                        </table>
                      </td>
                    </tr>

                    <!-- CTA Button -->
                    <tr>
                      <td style="padding: 8px 40px 32px; text-align: center;">
                        <a href="${warrantyUrl}" style="display: inline-block; background: linear-gradient(135deg, #DC3E15, #f97316); color: #ffffff; padding: 18px 48px; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 16px rgba(220, 62, 21, 0.35);">
                          Submit Missing Screenshots →
                        </a>
                      </td>
                    </tr>

                    <!-- Divider -->
                    <tr>
                      <td style="padding: 0 40px;">
                        <div style="height: 1px; background: #e2e8f0;"></div>
                      </td>
                    </tr>

                    <!-- Benefits Section -->
                    <tr>
                      <td style="padding: 32px 40px;">
                        <p style="margin: 0 0 16px; font-size: 15px; font-weight: 700; color: #1e293b;">Warranty Benefits</p>
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="padding: 6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td width="20" style="vertical-align: top; padding-top: 6px;">
                                    <div style="width: 6px; height: 6px; background: #DC3E15; border-radius: 50%;"></div>
                                  </td>
                                  <td style="font-size: 14px; color: #475569; padding-left: 8px;">
                                    <strong style="color: #1e293b;">Lifetime Protection</strong> — Free replacements if anything goes wrong
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td width="20" style="vertical-align: top; padding-top: 6px;">
                                    <div style="width: 6px; height: 6px; background: #DC3E15; border-radius: 50%;"></div>
                                  </td>
                                  <td style="font-size: 14px; color: #475569; padding-left: 8px;">
                                    <strong style="color: #1e293b;">Priority Support</strong> — Dedicated assistance for registered customers
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 6px 0;">
                              <table cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                  <td width="20" style="vertical-align: top; padding-top: 6px;">
                                    <div style="width: 6px; height: 6px; background: #DC3E15; border-radius: 50%;"></div>
                                  </td>
                                  <td style="font-size: 14px; color: #475569; padding-left: 8px;">
                                    <strong style="color: #1e293b;">No Additional Costs</strong> — Complete coverage at no extra charge
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

              <!-- Support Card -->
              <tr>
                <td style="padding-top: 24px;">
                  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                    <tr>
                      <td style="padding: 20px; text-align: center;">
                        <p style="margin: 0 0 12px; font-size: 14px; color: #64748b;">Need assistance? We're here to help.</p>
                        <a href="https://wa.me/918178848830" style="display: inline-block; background: #25D366; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 100px;">
                          Contact Support
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="padding: 32px 0; text-align: center;">
                  <p style="margin: 0 0 8px; font-size: 13px; color: #64748b;">
                    This is reminder ${reminderNumber} of ${maxReminders}
                  </p>
                  <p style="margin: 0; font-size: 12px; color: #94a3b8;">
                    © ${new Date().getFullYear()} SimplySolutions. All rights reserved.
                  </p>
                  <p style="margin: 12px 0 0; font-size: 11px; color: #cbd5e1;">
                    Daryaganj, New Delhi 110002, India
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const { data: result, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@auth.simplysolutions.co.in>',
      to: data.to,
      subject: subjectLine,
      html,
    });

    if (error) {
      console.error('Warranty reminder email send error:', error);
      return { success: false, error };
    }

    return { success: true, id: result?.id };
  } catch (error) {
    console.error('Warranty reminder email service error:', error);
    return { success: false, error };
  }
}
