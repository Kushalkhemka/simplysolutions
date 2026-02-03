/**
 * Test credentials endpoint
 * 
 * POST - Test SP API credentials by attempting to get an access token
 */

import { NextRequest, NextResponse } from 'next/server';
import { testCredentials } from '@/lib/amazon/seller-accounts';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { clientId, clientSecret, refreshToken } = body;

        if (!clientId || !clientSecret || !refreshToken) {
            return NextResponse.json(
                { error: 'Missing required fields: clientId, clientSecret, refreshToken' },
                { status: 400 }
            );
        }

        const result = await testCredentials(clientId, clientSecret, refreshToken);

        if (result.success) {
            return NextResponse.json({ success: true, message: 'Credentials are valid!' });
        } else {
            return NextResponse.json(
                { success: false, error: result.error },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Error testing credentials:', error);
        return NextResponse.json(
            { error: 'Failed to test credentials' },
            { status: 500 }
        );
    }
}
