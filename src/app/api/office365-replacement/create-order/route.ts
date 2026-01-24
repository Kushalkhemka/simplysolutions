import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';

// Use production Razorpay credentials from environment variables
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { firstName, lastName, email, phone } = body;

        // Validate input
        if (!firstName || !lastName || !email || !phone) {
            return NextResponse.json(
                { success: false, error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Validate phone format (10-digit Indian mobile)
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\s/g, '');
        if (!phoneRegex.test(cleanPhone)) {
            return NextResponse.json(
                { success: false, error: 'Invalid phone number' },
                { status: 400 }
            );
        }

        // Create Razorpay order for ₹499 (49900 paise)
        const order = await razorpay.orders.create({
            amount: 49900, // ₹499 in paise
            currency: 'INR',
            receipt: `office365_${Date.now()}`,
            notes: {
                product: 'Microsoft Office 365',
                fsn: 'OFFICE365',
                customer_name: `${firstName} ${lastName}`,
                customer_email: email,
                customer_phone: cleanPhone,
            },
        });

        return NextResponse.json({
            success: true,
            data: {
                razorpayOrderId: order.id,
                razorpayKeyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: order.amount,
                currency: order.currency,
            },
        });
    } catch (error: any) {
        console.error('Create order error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Failed to create order' },
            { status: 500 }
        );
    }
}
