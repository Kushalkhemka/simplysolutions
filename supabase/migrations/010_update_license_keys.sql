-- Migration: Update License Keys Table
-- Purpose: Add columns to support legacy data import (original keys, OS support, legacy FSN)

-- Add columns to amazon_activation_license_keys
ALTER TABLE amazon_activation_license_keys 
ADD COLUMN IF NOT EXISTS original_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS supported_os TEXT,
ADD COLUMN IF NOT EXISTS legacy_fsn VARCHAR(100),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

-- Add index for legacy lookups
CREATE INDEX IF NOT EXISTS idx_amazon_keys_original_key ON amazon_activation_license_keys(original_key);
CREATE INDEX IF NOT EXISTS idx_amazon_keys_legacy_fsn ON amazon_activation_license_keys(legacy_fsn);

-- Comment on columns
COMMENT ON COLUMN amazon_activation_license_keys.original_key IS 'Original license key from legacy system (may contain duplicates/dashes)';
COMMENT ON COLUMN amazon_activation_license_keys.supported_os IS 'Supported operating systems (Windows/Mac) from legacy data';
