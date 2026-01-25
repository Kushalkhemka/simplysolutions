import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { Resend } from 'resend';

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Generate unique 15-digit secret code
async function generateUniqueSecretCode(): Promise<string> {
  const maxAttempts = 10;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = Array.from({ length: 15 }, () =>
      Math.floor(Math.random() * 10)
    ).join('');

    const { data: existing } = await supabase
      .from('amazon_orders')
      .select('id')
      .eq('order_id', code)
      .single();

    if (!existing) {
      return code;
    }
  }

  throw new Error('Failed to generate unique secret code');
}

// Verify Razorpay payment signature
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const body = orderId + '|' + paymentId;
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

// Send confirmation email with secret code
async function sendSecretCodeEmail(data: {
  to: string;
  customerName: string;
  secretCode: string;
}) {
  const activateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://simplysolutions.co.in'}/activate?code=${data.secretCode}`;

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
              Payment Successful
            </h2>
            <p style="margin: 6px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
              Office 365 Replacement Purchase Confirmed
            </p>
          </div>

          <div style="padding: 32px;">
            <p style="margin: 0 0 24px; color: #475569; font-size: 15px; line-height: 1.6;">
              Hi <strong>${data.customerName}</strong>,<br>
              Thank you for your purchase. Please use the secret code below to activate your Microsoft Office 365 Pro Plus.
            </p>

            <!-- Secret Code Box -->
            <div style="background: #fef3c7; border: 1px solid #fbbf24; border-radius: 10px; padding: 24px; margin-bottom: 24px; text-align: center;">
              <p style="margin: 0 0 12px; font-size: 13px; color: #92400e; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                Your Secret Code
              </p>
              <div style="background: white; padding: 16px 24px; border-radius: 8px; border: 1px solid #fcd34d;">
                <code style="font-size: 26px; font-weight: 700; letter-spacing: 3px; color: #1e293b; font-family: 'Courier New', Consolas, monospace;">
                  ${data.secretCode}
                </code>
              </div>
              <p style="margin: 14px 0 0; font-size: 13px; color: #78716c;">
                Save this code securely. You will need it to get your license key.
              </p>
            </div>

            <!-- How to Activate -->
            <h3 style="margin: 0 0 14px; font-size: 15px; font-weight: 600; color: #1e293b;">
              How to Activate
            </h3>
            
            <ol style="margin: 0 0 24px; padding-left: 18px; color: #475569; line-height: 1.9; font-size: 14px;">
              <li>Go to our activation page</li>
              <li>Enter your 15-digit secret code</li>
              <li>Click "Verify & Generate" to receive your license key</li>
              <li>Follow the installation instructions provided</li>
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
                Activate Now
              </a>
            </div>

            <!-- Important Notice -->
            <div style="margin-top: 24px; background: #fef3c7; border: 1px solid #fcd34d; border-radius: 8px; padding: 16px;">
              <p style="margin: 0 0 8px; color: #92400e; font-size: 13px; font-weight: 600;">
                Important: Security Setup
              </p>
              <p style="margin: 0; color: #78716c; font-size: 13px; line-height: 1.6;">
                After activation, visit <a href="https://mysignins.microsoft.com/security-info" style="color: #2563eb; text-decoration: underline;">mysignins.microsoft.com/security-info</a> to link your personal email and phone number for account recovery. Please also save your password securely.
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
      subject: `Your Office 365 Secret Code - Activate Now`,
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      firstName,
      lastName,
      email,
      phone,
    } = body;

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, error: 'Missing payment details' },
        { status: 400 }
      );
    }

    if (!firstName || !lastName || !email || !phone) {
      return NextResponse.json(
        { success: false, error: 'Missing customer details' },
        { status: 400 }
      );
    }

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Generate unique 15-digit secret code
    const secretCode = await generateUniqueSecretCode();

    // Insert order into amazon_orders table
    const { error: insertError } = await supabase
      .from('amazon_orders')
      .insert({
        order_id: secretCode,
        fsn: 'OFFICE365',
        fulfillment_type: 'website_payment',
        contact_email: email.trim(),
        contact_phone: phone.trim(),
        warranty_status: 'PENDING',
        quantity: 1,
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: 'Failed to create order record' },
        { status: 500 }
      );
    }

    // Send confirmation email with secret code
    const customerName = `${firstName} ${lastName}`;
    await sendSecretCodeEmail({
      to: email.trim(),
      customerName,
      secretCode,
    });

    // Log the payment for reference
    console.log('Office 365 Replacement payment successful:', {
      secretCode,
      razorpay_payment_id,
      customer: customerName,
      email,
      phone,
    });

    return NextResponse.json({
      success: true,
      data: {
        secretCode,
        message: 'Payment verified and order created successfully',
      },
    });
  } catch (error: any) {
    console.error('Verify payment error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Payment verification failed' },
      { status: 500 }
    );
  }
}
