-- Migration: Simplify schema - remove amazon_secret_codes table
-- Secret codes are now stored directly as order_id in amazon_orders
-- Identified by fulfillment_type = 'amazon_digital'

-- 1. Drop the foreign key constraint first
ALTER TABLE amazon_orders DROP CONSTRAINT IF EXISTS amazon_orders_secret_code_id_fkey;

-- 2. Drop the secret_code_id column
ALTER TABLE amazon_orders DROP COLUMN IF EXISTS secret_code_id;

-- 3. Drop the amazon_secret_codes table
DROP TABLE IF EXISTS amazon_secret_codes;

-- Note: For digital delivery orders, the 15-digit secret code is now stored in order_id column
-- Use fulfillment_type to distinguish:
--   'amazon_fba' = FBA orders with Amazon Order ID format (XXX-XXXXXXX-XXXXXXX)
--   'amazon_digital' = Digital delivery with 15-digit secret code
