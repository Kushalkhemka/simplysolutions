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
        <strong>⚠️ Important:</strong> Please save your license keys in a safe place. You can also view them anytime in your <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/orders">order history</a>.
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
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@simplysolutions.com>',
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
            <span style="font-size: 32px; line-height: 1;">✉️</span>
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
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@simplysolutions.com>',
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
            <span style="font-size: 32px; line-height: 1;">🔐</span>
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
      from: process.env.EMAIL_FROM || 'SimplySolutions <noreply@simplysolutions.com>',
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
