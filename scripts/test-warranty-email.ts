import 'dotenv/config';
import { sendWarrantyResubmissionReminder } from '../src/lib/email';

async function sendTestEmail() {
    console.log('Sending test warranty reminder email...');

    const result = await sendWarrantyResubmissionReminder({
        to: 'kushalkhemka559@gmail.com',
        customerName: 'Kushal',
        orderId: 'TEST-ORDER-12345',
        productName: 'Microsoft Office 365 Pro Plus',
        missingSeller: true,
        missingReview: false,
        reminderNumber: 1,
        maxReminders: 3,
    });

    if (result.success) {
        console.log('✅ Email sent successfully!');
        console.log('Email ID:', result.id);
    } else {
        console.error('❌ Failed to send email:', result.error);
    }
}

sendTestEmail();
