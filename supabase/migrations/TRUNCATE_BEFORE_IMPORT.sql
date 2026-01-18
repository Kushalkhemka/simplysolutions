-- ============================================================
-- FIX: Increase license_key field size and truncate table
-- Run this in Supabase SQL Editor BEFORE running import script
-- ============================================================

-- 1. Empty the table completely (not just delete)
TRUNCATE TABLE amazon_activation_license_keys;

-- 2. Alter license_key column to allow longer keys (with trailing chars)
ALTER TABLE amazon_activation_license_keys 
ALTER COLUMN license_key TYPE TEXT;

-- 3. Verify
SELECT COUNT(*) as total FROM amazon_activation_license_keys;
