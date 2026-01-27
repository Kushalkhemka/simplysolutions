import { NextResponse } from 'next/server';
import { sendPushToAdmins } from '@/lib/push/admin-notifications';

// POST /api/push/test-admin - Send a test push notification to admins
export async function POST() {
    try {
        await sendPushToAdmins({
            title: '✅ Test Notification',
            body: 'Push notifications are working! This is a test from SimplySolutions.',
            type: 'test',
            data: { timestamp: new Date().toISOString() },
            tag: 'test-notification',
        });

        return NextResponse.json({ success: true, message: 'Test notification sent to admins' });
    } catch (error) {
        console.error('Error sending test notification:', error);
        return NextResponse.json({ success: false, error: 'Failed to send notification' }, { status: 500 });
    }
}
