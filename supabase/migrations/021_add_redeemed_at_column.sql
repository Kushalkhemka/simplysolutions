-- ============================================================
-- ADD redeemed_at COLUMN TO amazon_activation_license_keys
-- Tracks when license keys are redeemed for date filtering
-- ============================================================

-- 1. Add redeemed_at column
ALTER TABLE amazon_activation_license_keys 
ADD COLUMN IF NOT EXISTS redeemed_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for efficient date filtering
CREATE INDEX IF NOT EXISTS idx_keys_redeemed_at 
ON amazon_activation_license_keys(redeemed_at) 
WHERE redeemed_at IS NOT NULL;

-- 3. Backfill: Set redeemed_at to created_at for existing redeemed keys
-- (This is an approximation since we don't have the actual redemption date)
UPDATE amazon_activation_license_keys 
SET redeemed_at = created_at 
WHERE is_redeemed = true AND redeemed_at IS NULL;

-- 4. Verify
SELECT 
    COUNT(*) FILTER (WHERE is_redeemed = true) as redeemed_count,
    COUNT(*) FILTER (WHERE redeemed_at IS NOT NULL) as with_redeemed_at
FROM amazon_activation_license_keys;
