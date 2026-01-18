-- ============================================================
-- FIX LICENSE KEYS TABLE: Clean Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- STEP 1: Drop unnecessary columns
ALTER TABLE amazon_activation_license_keys 
DROP COLUMN IF EXISTS sku,
DROP COLUMN IF EXISTS legacy_fsn;

-- STEP 2: Ensure FSN column exists and is properly configured
-- Check if fsn column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'amazon_activation_license_keys' AND column_name = 'fsn'
    ) THEN
        ALTER TABLE amazon_activation_license_keys ADD COLUMN fsn VARCHAR(100);
    END IF;
END $$;

-- STEP 3: Add is_redeemed column if missing
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'amazon_activation_license_keys' AND column_name = 'is_redeemed'
    ) THEN
        ALTER TABLE amazon_activation_license_keys ADD COLUMN is_redeemed BOOLEAN DEFAULT false;
    END IF;
END $$;

-- STEP 4: Drop is_assigned if it exists (we'll use is_redeemed instead)
ALTER TABLE amazon_activation_license_keys 
DROP COLUMN IF EXISTS is_assigned;

-- STEP 5: Create index on FSN
CREATE INDEX IF NOT EXISTS idx_amazon_keys_fsn ON amazon_activation_license_keys(fsn);

-- STEP 6: Check current table structure
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'amazon_activation_license_keys'
ORDER BY ordinal_position;

-- ============================================================
-- ABOUT amazon_secret_codes TABLE:
-- ============================================================
-- This table is for DIGITAL DELIVERY (not FBA).
-- - Customer buys on Amazon → receives 15-digit SECRET CODE via email
-- - Customer enters code on /activate → gets license key
-- 
-- Flow: secret_code → license_key (linked via license_key_id FK)
-- 
-- This is different from /activation which uses ORDER ID for FBA orders.
-- ============================================================
