-- Migration: Clean up amazon_orders table
-- 1. Remove redundant columns (data available via FSN mapping in products_data)
-- 2. Fix fulfillment_type for 15-digit order IDs (should be amazon_digital)
-- 3. Fix getcid_used for orders with confirmation_id

-- ============================================
-- 1. Drop redundant columns
-- ============================================
-- product_title, product_type, asin, installation_doc, order_status can all be derived or are unused

ALTER TABLE amazon_orders DROP COLUMN IF EXISTS product_title;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS product_type;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS asin;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS installation_doc;
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS order_status;

-- ============================================
-- 2. Fix fulfillment_type for 15-digit order IDs
-- ============================================
-- Order IDs that are 15-17 digits are digital delivery (secret codes)
-- Order IDs with format XXX-XXXXXXX-XXXXXXX are FBA

UPDATE amazon_orders
SET fulfillment_type = 'amazon_digital'
WHERE order_id ~ '^\d{15,17}$'
AND fulfillment_type = 'amazon_fba';

-- ============================================
-- 3. Fix getcid_used flag
-- ============================================
-- If confirmation_id is not null/empty, getcid_used should be true

UPDATE amazon_orders
SET getcid_used = true,
    getcid_used_at = COALESCE(getcid_used_at, updated_at)
WHERE confirmation_id IS NOT NULL 
AND confirmation_id != ''
AND getcid_used = false;

-- ============================================
-- 4. Add comments
-- ============================================
COMMENT ON TABLE amazon_orders IS 'Amazon orders - both FBA (Order ID format) and Digital Delivery (15-digit secret codes stored in order_id)';
COMMENT ON COLUMN amazon_orders.order_id IS 'FBA: XXX-XXXXXXX-XXXXXXX format, Digital: 15-digit secret code';
COMMENT ON COLUMN amazon_orders.fulfillment_type IS 'amazon_fba or amazon_digital';
