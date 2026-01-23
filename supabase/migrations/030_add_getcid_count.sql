-- Migration: Add getcid_count column to amazon_orders
-- This column tracks how many times GetCID has been used for an order

-- Add getcid_count column if it doesn't exist
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS getcid_count INTEGER DEFAULT 0;

-- Add comment for documentation
COMMENT ON COLUMN amazon_orders.getcid_count IS 'Number of times GetCID has been used for this order';

-- Update existing orders: if getcid_used is true, set getcid_count to 1
UPDATE amazon_orders 
SET getcid_count = 1 
WHERE getcid_used = true AND getcid_count IS NULL;

-- Set default for any NULL values
UPDATE amazon_orders 
SET getcid_count = 0 
WHERE getcid_count IS NULL;
