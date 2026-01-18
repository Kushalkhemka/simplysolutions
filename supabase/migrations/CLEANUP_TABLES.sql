-- ============================================================
-- SIMPLIFY amazon_activation_license_keys TABLE
-- Allow duplicate keys (same key with different dashes/suffixes)
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Empty cart_items
TRUNCATE TABLE cart_items CASCADE;

-- 2. Drop license_keys table if exists
DROP TABLE IF EXISTS license_keys CASCADE;

-- 3. Drop FK constraint from amazon_secret_codes
ALTER TABLE amazon_secret_codes DROP CONSTRAINT IF EXISTS amazon_secret_codes_license_key_id_fkey;

-- 4. Drop the old table
DROP TABLE IF EXISTS amazon_activation_license_keys CASCADE;

-- 5. Create new simplified table (NO UNIQUE on license_key)
CREATE TABLE amazon_activation_license_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key TEXT NOT NULL,  -- No UNIQUE constraint
    fsn VARCHAR(100) NOT NULL,
    is_redeemed BOOLEAN DEFAULT false,
    order_id VARCHAR(50) DEFAULT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create indexes
CREATE INDEX idx_keys_fsn ON amazon_activation_license_keys(fsn);
CREATE INDEX idx_keys_redeemed ON amazon_activation_license_keys(is_redeemed);
CREATE INDEX idx_keys_order ON amazon_activation_license_keys(order_id);
CREATE INDEX idx_keys_license ON amazon_activation_license_keys(license_key);

-- 7. Enable RLS
ALTER TABLE amazon_activation_license_keys ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies
CREATE POLICY "Service role full access" ON amazon_activation_license_keys
    FOR ALL USING (true) WITH CHECK (true);

-- 9. Verify structure
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_name = 'amazon_activation_license_keys'
ORDER BY ordinal_position;
