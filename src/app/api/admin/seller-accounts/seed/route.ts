/**
 * One-time setup endpoint to seed the initial seller account
 * from environment variables to the database.
 * 
 * DELETE THIS FILE after initial setup is complete!
 */

import { NextRequest, NextResponse } from 'next/server';
import { addSellerAccount } from '@/lib/amazon/seller-accounts';

export async function POST(request: NextRequest) {
    try {
        // Optional auth check
        const authHeader = request.headers.get('authorization');
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get credentials from environment variables
        const clientId = process.env.AMAZON_SP_CLIENT_ID;
        const clientSecret = process.env.AMAZON_SP_CLIENT_SECRET;
        const refreshToken = process.env.AMAZON_SP_REFRESH_TOKEN;
        const merchantToken = process.env.AMAZON_SP_MERCHANT_TOKEN;
        const marketplaceId = process.env.AMAZON_SP_MARKETPLACE_ID || 'A21TJRUUN4KGV';

        if (!clientId || !clientSecret || !refreshToken || !merchantToken) {
            return NextResponse.json({
                error: 'Missing environment variables. Required: AMAZON_SP_CLIENT_ID, AMAZON_SP_CLIENT_SECRET, AMAZON_SP_REFRESH_TOKEN, AMAZON_SP_MERCHANT_TOKEN'
            }, { status: 400 });
        }

        // Add the account to database
        const account = await addSellerAccount({
            name: 'SimplySolutions Main',
            clientId,
            clientSecret,
            refreshToken,
            merchantToken,
            marketplaceId,
            priority: 10, // Highest priority for main account
        });

        return NextResponse.json({
            success: true,
            message: 'Account added successfully! You can now remove the AMAZON_SP_* env vars from Coolify and DELETE this file.',
            account: {
                id: account.id,
                name: account.name,
                merchantToken: account.merchantToken,
                marketplaceId: account.marketplaceId,
                priority: account.priority,
            }
        });

    } catch (error: unknown) {
        console.error('Error seeding seller account:', error);
        return NextResponse.json({
            error: error instanceof Error ? error.message : 'Failed to seed account'
        }, { status: 500 });
    }
}
