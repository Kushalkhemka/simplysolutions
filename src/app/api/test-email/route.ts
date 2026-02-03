import { NextRequest, NextResponse } from 'next/server';
import { sendWarrantyResubmissionReminder } from '@/lib/email';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const result = await sendWarrantyResubmissionReminder({
            to: body.to || 'kushalkhemka559@gmail.com',
            customerName: body.customerName || 'Test User',
            orderId: body.orderId || 'TEST-ORDER-12345',
            productName: body.productName || 'Microsoft Office 365 Pro Plus',
            missingSeller: body.missingSeller ?? true,
            missingReview: body.missingReview ?? false,
            reminderNumber: body.reminderNumber || 1,
            maxReminders: body.maxReminders || 3,
        });

        if (result.success) {
            return NextResponse.json({ success: true, emailId: result.id });
        } else {
            return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }
    } catch (error) {
        console.error('Test email error:', error);
        return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
    }
}
