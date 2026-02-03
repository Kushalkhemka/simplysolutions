/**
 * Amazon Seller Accounts Utility
 * 
 * Handles encryption/decryption of credentials and fetching active accounts.
 * Uses AES-256-GCM encryption for secure credential storage.
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Encryption key from environment (must be 32 bytes for AES-256)
function getEncryptionKey(): Buffer {
    const key = process.env.CREDENTIALS_ENCRYPTION_KEY;
    if (!key) {
        throw new Error('CREDENTIALS_ENCRYPTION_KEY environment variable is not set');
    }
    // Use SHA-256 to ensure we always have exactly 32 bytes
    return crypto.createHash('sha256').update(key).digest();
}

/**
 * Encrypt a plaintext string using AES-256-GCM
 */
export function encrypt(plaintext: string): string {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    // Format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * Decrypt an encrypted string using AES-256-GCM
 */
export function decrypt(encryptedText: string): string {
    const key = getEncryptionKey();
    const parts = encryptedText.split(':');

    if (parts.length !== 3) {
        throw new Error('Invalid encrypted text format');
    }

    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

export interface SellerAccount {
    id: string;
    name: string;
    merchantToken: string;
    marketplaceId: string;
    priority: number;
    isActive: boolean;
    lastSyncAt: string | null;
    lastSyncStatus: string | null;
    ordersSyncedCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface SellerAccountWithCredentials extends SellerAccount {
    clientId: string;
    clientSecret: string;
    refreshToken: string;
}

export interface SellerAccountInput {
    name: string;
    clientId: string;
    clientSecret: string;
    refreshToken: string;
    merchantToken: string;
    marketplaceId?: string;
    priority?: number;
    isActive?: boolean;
}

/**
 * Get all active seller accounts with decrypted credentials
 * Used by cron jobs to iterate through accounts
 */
export async function getActiveSellerAccounts(): Promise<SellerAccountWithCredentials[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('amazon_seller_accounts')
        .select('*')
        .eq('is_active', true)
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching seller accounts:', error);
        throw error;
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Decrypt credentials for each account
    return data.map(account => ({
        id: account.id,
        name: account.name,
        clientId: decrypt(account.client_id),
        clientSecret: decrypt(account.client_secret),
        refreshToken: decrypt(account.refresh_token),
        merchantToken: account.merchant_token,
        marketplaceId: account.marketplace_id,
        priority: account.priority || 100,
        isActive: account.is_active,
        lastSyncAt: account.last_sync_at,
        lastSyncStatus: account.last_sync_status,
        ordersSyncedCount: account.orders_synced_count,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
    }));
}

/**
 * Get all seller accounts (without credentials) for admin display
 */
export async function getAllSellerAccounts(): Promise<SellerAccount[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('amazon_seller_accounts')
        .select('id, name, merchant_token, marketplace_id, priority, is_active, last_sync_at, last_sync_status, orders_synced_count, created_at, updated_at')
        .order('priority', { ascending: true })
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching seller accounts:', error);
        throw error;
    }

    return (data || []).map(account => ({
        id: account.id,
        name: account.name,
        merchantToken: account.merchant_token,
        marketplaceId: account.marketplace_id,
        priority: account.priority || 100,
        isActive: account.is_active,
        lastSyncAt: account.last_sync_at,
        lastSyncStatus: account.last_sync_status,
        ordersSyncedCount: account.orders_synced_count,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
    }));
}

/**
 * Add a new seller account with encrypted credentials
 */
export async function addSellerAccount(input: SellerAccountInput): Promise<SellerAccount> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
        .from('amazon_seller_accounts')
        .insert({
            name: input.name,
            client_id: encrypt(input.clientId),
            client_secret: encrypt(input.clientSecret),
            refresh_token: encrypt(input.refreshToken),
            merchant_token: input.merchantToken,
            marketplace_id: input.marketplaceId || 'A21TJRUUN4KGV',
            priority: input.priority ?? 100,
            is_active: input.isActive ?? true,
        })
        .select('id, name, merchant_token, marketplace_id, priority, is_active, last_sync_at, last_sync_status, orders_synced_count, created_at, updated_at')
        .single();

    if (error) {
        console.error('Error adding seller account:', error);
        throw error;
    }

    return {
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
    };
}

/**
 * Update an existing seller account
 * Only re-encrypts credentials if they are provided
 */
export async function updateSellerAccount(
    id: string,
    input: Partial<SellerAccountInput>
): Promise<SellerAccount> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Build update object, only encrypting credentials if provided
    const updateData: Record<string, unknown> = {};

    if (input.name !== undefined) updateData.name = input.name;
    if (input.clientId !== undefined) updateData.client_id = encrypt(input.clientId);
    if (input.clientSecret !== undefined) updateData.client_secret = encrypt(input.clientSecret);
    if (input.refreshToken !== undefined) updateData.refresh_token = encrypt(input.refreshToken);
    if (input.merchantToken !== undefined) updateData.merchant_token = input.merchantToken;
    if (input.marketplaceId !== undefined) updateData.marketplace_id = input.marketplaceId;
    if (input.priority !== undefined) updateData.priority = input.priority;
    if (input.isActive !== undefined) updateData.is_active = input.isActive;

    const { data, error } = await supabase
        .from('amazon_seller_accounts')
        .update(updateData)
        .eq('id', id)
        .select('id, name, merchant_token, marketplace_id, priority, is_active, last_sync_at, last_sync_status, orders_synced_count, created_at, updated_at')
        .single();

    if (error) {
        console.error('Error updating seller account:', error);
        throw error;
    }

    return {
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
    };
}

/**
 * Delete a seller account
 */
export async function deleteSellerAccount(id: string): Promise<void> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // First, check if there are orders linked to this account
    const { count } = await supabase
        .from('amazon_orders')
        .select('*', { count: 'exact', head: true })
        .eq('seller_account_id', id);

    if (count && count > 0) {
        // Set orders' seller_account_id to null instead of blocking delete
        await supabase
            .from('amazon_orders')
            .update({ seller_account_id: null })
            .eq('seller_account_id', id);
    }

    const { error } = await supabase
        .from('amazon_seller_accounts')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting seller account:', error);
        throw error;
    }
}

/**
 * Update sync status for an account
 */
export async function updateSyncStatus(
    id: string,
    status: 'success' | string,
    ordersSynced?: number
): Promise<void> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const updateData: Record<string, unknown> = {
        last_sync_at: new Date().toISOString(),
        last_sync_status: status,
    };

    if (ordersSynced !== undefined) {
        // Increment orders_synced_count
        const { data: current } = await supabase
            .from('amazon_seller_accounts')
            .select('orders_synced_count')
            .eq('id', id)
            .single();

        updateData.orders_synced_count = (current?.orders_synced_count || 0) + ordersSynced;
    }

    await supabase
        .from('amazon_seller_accounts')
        .update(updateData)
        .eq('id', id);
}

/**
 * Test credentials by attempting to get an access token
 */
export async function testCredentials(
    clientId: string,
    clientSecret: string,
    refreshToken: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const response = await fetch('https://api.amazon.com/auth/o2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                grant_type: 'refresh_token',
                refresh_token: refreshToken,
                client_id: clientId,
                client_secret: clientSecret,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            return {
                success: false,
                error: errorData.error_description || errorData.error || 'Failed to authenticate',
            };
        }

        const data = await response.json();
        if (data.access_token) {
            return { success: true };
        }

        return { success: false, error: 'No access token received' };
    } catch (error) {
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
