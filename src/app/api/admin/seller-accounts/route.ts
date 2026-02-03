/**
 * Admin API for managing Amazon Seller Accounts
 * 
 * GET - List all seller accounts (without credentials)
 * POST - Add a new seller account
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    getAllSellerAccounts,
    addSellerAccount,
} from '@/lib/amazon/seller-accounts';

export async function GET() {
    try {
        const accounts = await getAllSellerAccounts();
        return NextResponse.json({ accounts });
    } catch (error) {
        console.error('Error fetching seller accounts:', error);
        return NextResponse.json(
            { error: 'Failed to fetch seller accounts' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { name, clientId, clientSecret, refreshToken, merchantToken, marketplaceId, priority } = body;

        // Validate required fields
        if (!name || !clientId || !clientSecret || !refreshToken || !merchantToken) {
            return NextResponse.json(
                { error: 'Missing required fields: name, clientId, clientSecret, refreshToken, merchantToken' },
                { status: 400 }
            );
        }

        const account = await addSellerAccount({
            name,
            clientId,
            clientSecret,
            refreshToken,
            merchantToken,
            marketplaceId: marketplaceId || 'A21TJRUUN4KGV',
            priority: priority ?? 100,
            isActive: true,
        });

        return NextResponse.json({ account });
    } catch (error) {
        console.error('Error adding seller account:', error);
        return NextResponse.json(
            { error: 'Failed to add seller account' },
            { status: 500 }
        );
    }
}
