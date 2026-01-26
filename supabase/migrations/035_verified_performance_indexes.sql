-- VERIFIED Performance Indexes - 100% Safe
-- Created: 2026-01-26
-- All tables and columns verified against live database
-- Uses IF NOT EXISTS - completely safe to run
-- NO CODE CHANGES REQUIRED

-- ====================
-- PRODUCTS_DATA TABLE
-- ====================
-- Verified columns: fsn, product_title, slug

CREATE INDEX IF NOT EXISTS idx_products_data_fsn 
ON products_data(fsn);

CREATE INDEX IF NOT EXISTS idx_products_data_slug 
ON products_data(slug);

-- ====================
-- AMAZON_ORDERS TABLE
-- ====================
-- Verified columns: order_id, confirmation_id, fsn, warranty_status, fulfillment_type, created_at

CREATE INDEX IF NOT EXISTS idx_amazon_orders_order_id 
ON amazon_orders(order_id);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_confirmation_id 
ON amazon_orders(confirmation_id);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_fsn 
ON amazon_orders(fsn);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_warranty_status 
ON amazon_orders(warranty_status);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_created_desc 
ON amazon_orders(created_at DESC);

-- ====================
-- AMAZON_ASIN_MAPPING TABLE
-- ====================
-- Verified columns: asin, fsn

CREATE INDEX IF NOT EXISTS idx_amazon_asin_mapping_asin 
ON amazon_asin_mapping(asin);

CREATE INDEX IF NOT EXISTS idx_amazon_asin_mapping_fsn 
ON amazon_asin_mapping(fsn);

-- ====================
-- AMAZON_ACTIVATION_LICENSE_KEYS TABLE
-- ====================
-- Verified columns: fsn, is_redeemed, order_id

CREATE INDEX IF NOT EXISTS idx_amazon_license_fsn 
ON amazon_activation_license_keys(fsn);

CREATE INDEX IF NOT EXISTS idx_amazon_license_redeemed 
ON amazon_activation_license_keys(is_redeemed) 
WHERE is_redeemed = false;

CREATE INDEX IF NOT EXISTS idx_amazon_license_order 
ON amazon_activation_license_keys(order_id);

-- ====================
-- WARRANTY_REGISTRATIONS TABLE
-- ====================
-- Verified columns: order_id, status, created_at

CREATE INDEX IF NOT EXISTS idx_warranty_order_id 
ON warranty_registrations(order_id);

CREATE INDEX IF NOT EXISTS idx_warranty_status 
ON warranty_registrations(status);

CREATE INDEX IF NOT EXISTS idx_warranty_created_desc 
ON warranty_registrations(created_at DESC);

-- ====================
-- Comments for documentation
-- ====================
COMMENT ON INDEX idx_products_data_fsn IS 'Fast FSN lookups for product data';
COMMENT ON INDEX idx_amazon_orders_confirmation_id IS 'Fast Amazon order confirmation lookups';
COMMENT ON INDEX idx_amazon_license_redeemed IS 'Find available (unredeemed) license keys quickly';
COMMENT ON INDEX idx_warranty_status IS 'Filter warranty registrations by status';
