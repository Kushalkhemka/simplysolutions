-- Migration: Simplify amazon_orders - add only essential fields
-- Remove redundant columns and add only is_fraud + last_access_ip

-- ============================================
-- 1. Drop redundant columns
-- ============================================
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS product_title;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS product_type;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS asin;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS installation_doc;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS order_status;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS secret_code_id;

-- ============================================
-- 2. Add only essential new fields
-- ============================================
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS is_fraud BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS last_access_ip VARCHAR(45);

-- ============================================
-- 3. Fix fulfillment_type for 15-digit order IDs
-- ============================================
UPDATE amazon_orders
SET fulfillment_type = 'amazon_digital'
WHERE order_id ~ '^\d{15,17}$'
AND fulfillment_type = 'amazon_fba';

-- ============================================
-- 4. Fix getcid_used flag
-- ============================================
UPDATE amazon_orders
SET getcid_used = true,
    getcid_used_at = COALESCE(getcid_used_at, updated_at)
WHERE confirmation_id IS NOT NULL 
AND confirmation_id != ''
AND getcid_used = false;

-- ============================================
-- 5. Drop amazon_secret_codes table
-- ============================================
DROP TABLE IF EXISTS amazon_secret_codes;

-- Comments
COMMENT ON TABLE amazon_orders IS 'Amazon orders - FBA (XXX-XXXXXXX-XXXXXXX) and Digital (15-digit codes in order_id)';
COMMENT ON COLUMN amazon_orders.is_fraud IS 'True if order is fraudulent (refund after redeem, etc)';
COMMENT ON COLUMN amazon_orders.last_access_ip IS 'IP address of last activation attempt';
