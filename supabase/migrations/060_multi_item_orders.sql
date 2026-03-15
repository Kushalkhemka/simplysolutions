-- Migration: Multi-Item Order Support
-- Purpose: Allow multiple rows per order_id in amazon_orders (one per product/FSN)
-- This enables orders with multiple different ASINs to each get their own
-- FSN, license key, and activation flow.

-- Step 1: Drop the existing UNIQUE(order_id) constraint
ALTER TABLE amazon_orders
DROP CONSTRAINT IF EXISTS amazon_orders_order_id_key;

-- Step 2: Add new composite unique constraint (order_id + fsn)
-- This allows multiple rows per order_id as long as each has a different FSN
-- Using a unique index with COALESCE to handle NULL fsn values properly
CREATE UNIQUE INDEX IF NOT EXISTS idx_amazon_orders_order_id_fsn
ON amazon_orders(order_id, COALESCE(fsn, id::text));

-- Comment
COMMENT ON TABLE amazon_orders IS 'Amazon orders - supports multiple items per order ID (one row per order_id + FSN combination)';
