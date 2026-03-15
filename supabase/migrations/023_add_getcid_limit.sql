-- Migration: Add getcid_limit column to amazon_orders
-- Purpose: Store the GetCID usage limit per order (admin-editable).
-- Default is quantity × 2 for all FSNs.

-- Step 1: Add the column with default 1
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS getcid_limit INTEGER NOT NULL DEFAULT 1;

-- Step 2: Backfill all existing orders to qty × 2
UPDATE amazon_orders
SET getcid_limit = COALESCE(quantity, 1) * 2;

COMMENT ON COLUMN amazon_orders.getcid_limit IS 'GetCID usage limit (default: qty × 2). Admin can override.';
