import Razorpay from 'razorpay';

// Lazy initialize Razorpay instance
let razorpayInstance: Razorpay | null = null;

function getRazorpay(): Razorpay {
    if (!razorpayInstance) {
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            throw new Error('Razorpay credentials not configured');
        }
        razorpayInstance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
    }
    return razorpayInstance;
}

export interface CreateOrderOptions {
    amount: number; // in paise (INR * 100)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export async function createRazorpayOrder(options: CreateOrderOptions) {
    const order = await getRazorpay().orders.create({
        amount: options.amount,
        currency: options.currency || 'INR',
        receipt: options.receipt,
        notes: options.notes || {},
    });

    return order;
}

export async function verifyPaymentSignature(
    orderId: string,
    paymentId: string,
    signature: string
): Promise<boolean> {
    const crypto = await import('crypto');

    const body = orderId + '|' + paymentId;
    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
}

export async function fetchPaymentDetails(paymentId: string) {
    return getRazorpay().payments.fetch(paymentId);
}

export async function refundPayment(paymentId: string, amount?: number) {
    if (amount) {
        return getRazorpay().payments.refund(paymentId, { amount });
    }
    return getRazorpay().payments.refund(paymentId, {});
}
