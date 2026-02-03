/**
 * Admin API for managing a specific Amazon Seller Account
 * 
 * GET - Get a single account (without credentials)
 * PUT - Update an existing account
 * DELETE - Delete an account
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
    updateSellerAccount,
    deleteSellerAccount,
} from '@/lib/amazon/seller-accounts';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const supabase = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await supabase
            .from('amazon_seller_accounts')
            .select('id, name, merchant_token, marketplace_id, priority, is_active, last_sync_at, last_sync_status, orders_synced_count, created_at, updated_at')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json(
                { error: 'Account not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            account: {
                id: data.id,
                name: data.name,
                merchantToken: data.merchant_token,
                marketplaceId: data.marketplace_id,
                priority: data.priority || 100,
                isActive: data.is_active,
                lastSyncAt: data.last_sync_at,
                lastSyncStatus: data.last_sync_status,
                ordersSyncedCount: data.orders_synced_count,
                createdAt: data.created_at,
                updatedAt: data.updated_at,
            }
        });
    } catch (error) {
        console.error('Error fetching seller account:', error);
        return NextResponse.json(
            { error: 'Failed to fetch seller account' },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        const { name, clientId, clientSecret, refreshToken, merchantToken, marketplaceId, priority, isActive } = body;

        // At least one field must be provided
        if (!name && !clientId && !clientSecret && !refreshToken && !merchantToken && !marketplaceId && priority === undefined && isActive === undefined) {
            return NextResponse.json(
                { error: 'No fields to update' },
                { status: 400 }
            );
        }

        const account = await updateSellerAccount(id, {
            name,
            clientId,
            clientSecret,
            refreshToken,
            merchantToken,
            marketplaceId,
            priority,
            isActive,
        });

        return NextResponse.json({ account });
    } catch (error) {
        console.error('Error updating seller account:', error);
        return NextResponse.json(
            { error: 'Failed to update seller account' },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await deleteSellerAccount(id);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error deleting seller account:', error);
        return NextResponse.json(
            { error: 'Failed to delete seller account' },
            { status: 500 }
        );
    }
}
