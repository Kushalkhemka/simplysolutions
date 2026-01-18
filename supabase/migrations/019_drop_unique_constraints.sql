-- Run this in Supabase SQL Editor to drop unique constraint on license_key

-- Drop unique constraint on license_key (allow same key for multiple orders)
-- UUID keeps row uniqueness
ALTER TABLE amazon_activation_license_keys 
DROP CONSTRAINT IF EXISTS amazon_activation_license_keys_license_key_key;

-- NOTE: order_id unique constraint stays - each order must be unique
