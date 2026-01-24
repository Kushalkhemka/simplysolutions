-- Migration: Add BLOCKED status to warranty_status column
-- Purpose: Allow admins to block orders from accessing /activate and /getcid

-- Drop the existing CHECK constraint
ALTER TABLE amazon_orders DROP CONSTRAINT IF EXISTS amazon_orders_warranty_status_check;

-- Add new CHECK constraint that includes BLOCKED
ALTER TABLE amazon_orders ADD CONSTRAINT amazon_orders_warranty_status_check 
  CHECK (warranty_status IN ('PENDING', 'APPROVED', 'REJECTED', 'BLOCKED'));

-- Comment on the change
COMMENT ON COLUMN amazon_orders.warranty_status IS 'Order warranty status: PENDING, APPROVED, REJECTED, or BLOCKED (blocks customer from /activate and /getcid)';
