-- FBA Order Redemption Prevention - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add fulfillment_status column to track Amazon order status
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS fulfillment_status VARCHAR(20) DEFAULT 'Pending';

-- 2. Add shipped_at column to track when order was shipped
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMP WITH TIME ZONE;

-- 3. Add redeemable_at column for postal code-based delay
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS redeemable_at TIMESTAMP WITH TIME ZONE;

-- 4. Migration: Set existing FBA orders to Shipped to avoid blocking current customers
-- This ensures customers who already have products aren't suddenly blocked
UPDATE amazon_orders 
SET 
    fulfillment_status = 'Shipped', 
    redeemable_at = NOW() 
WHERE fulfillment_type = 'amazon_fba' 
  AND (fulfillment_status IS NULL OR fulfillment_status = 'Pending');

-- 5. Create index for faster lookups by fulfillment status
CREATE INDEX IF NOT EXISTS idx_amazon_orders_fulfillment_status 
ON amazon_orders(fulfillment_status) 
WHERE fulfillment_type = 'amazon_fba';

-- Verify the changes
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'amazon_orders' 
  AND column_name IN ('fulfillment_status', 'shipped_at', 'redeemable_at');
