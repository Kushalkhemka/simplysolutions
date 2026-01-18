-- Fix Column Limits and Re-import
-- Run this in Supabase SQL Editor

-- 1. Truncate tables (delete all data)
TRUNCATE TABLE amazon_orders CASCADE;
TRUNCATE TABLE amazon_activation_license_keys CASCADE;

-- 2. Increase VARCHAR limits for license keys
ALTER TABLE amazon_activation_license_keys 
ALTER COLUMN license_key TYPE VARCHAR(100),
ALTER COLUMN original_key TYPE VARCHAR(100),
ALTER COLUMN sku TYPE VARCHAR(100);

-- 3. Increase VARCHAR limits for orders
ALTER TABLE amazon_orders 
ALTER COLUMN fsn TYPE VARCHAR(100),
ALTER COLUMN order_id TYPE VARCHAR(100);

-- Done! Now re-run the import scripts
