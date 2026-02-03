-- Migration: Add Amazon Seller Accounts table for multi-seller support
-- Run this in your Supabase SQL Editor

-- Create seller accounts table with encrypted credentials
CREATE TABLE IF NOT EXISTS amazon_seller_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    client_id TEXT NOT NULL,          -- AES-256 encrypted
    client_secret TEXT NOT NULL,      -- AES-256 encrypted
    refresh_token TEXT NOT NULL,      -- AES-256 encrypted
    merchant_token TEXT NOT NULL,     -- Seller ID
    marketplace_id TEXT NOT NULL DEFAULT 'A21TJRUUN4KGV', -- India
    priority INTEGER NOT NULL DEFAULT 100,  -- Lower number = higher priority (processed first)
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    last_sync_status TEXT,
    orders_synced_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create index on priority for efficient ordering
CREATE INDEX IF NOT EXISTS idx_seller_accounts_priority ON amazon_seller_accounts(priority ASC, created_at ASC);

-- Create index on is_active for efficient filtering
CREATE INDEX IF NOT EXISTS idx_seller_accounts_active ON amazon_seller_accounts(is_active) WHERE is_active = true;

-- Add seller_account_id column to amazon_orders table
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS seller_account_id UUID REFERENCES amazon_seller_accounts(id) ON DELETE SET NULL;

-- Create index on seller_account_id for efficient filtering
CREATE INDEX IF NOT EXISTS idx_amazon_orders_seller_account ON amazon_orders(seller_account_id);

-- Enable RLS on seller accounts table
ALTER TABLE amazon_seller_accounts ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow service role full access (for cron jobs and admin APIs)
CREATE POLICY "Service role has full access to seller accounts"
ON amazon_seller_accounts
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_seller_account_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_seller_accounts_updated_at ON amazon_seller_accounts;
CREATE TRIGGER update_seller_accounts_updated_at
BEFORE UPDATE ON amazon_seller_accounts
FOR EACH ROW
EXECUTE FUNCTION update_seller_account_updated_at();

-- Comment for documentation
COMMENT ON TABLE amazon_seller_accounts IS 'Stores Amazon SP API credentials for multiple seller accounts with encrypted credentials';
COMMENT ON COLUMN amazon_seller_accounts.client_id IS 'AES-256 encrypted SP API Client ID';
COMMENT ON COLUMN amazon_seller_accounts.client_secret IS 'AES-256 encrypted SP API Client Secret';
COMMENT ON COLUMN amazon_seller_accounts.refresh_token IS 'AES-256 encrypted SP API Refresh Token';
COMMENT ON COLUMN amazon_seller_accounts.priority IS 'Sync priority - lower numbers are processed first (1 = highest)';
COMMENT ON COLUMN amazon_seller_accounts.orders_synced_count IS 'Running count of orders synced from this account';
