-- Migration: Add secret_codes array to order_items for tracking activation codes
-- Each order item can have multiple secret codes (one per quantity unit)

-- Add secret_codes column to order_items
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS secret_codes TEXT[];

-- Add product_fsn column to order_items to track the FSN used at time of order
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_fsn VARCHAR(50);

-- Add comments
COMMENT ON COLUMN order_items.secret_codes IS 'Array of secret codes for activation - one per quantity unit';
COMMENT ON COLUMN order_items.product_fsn IS 'FSN code at time of order for activation system';

-- Create index for looking up by secret code
CREATE INDEX IF NOT EXISTS idx_order_items_secret_codes ON order_items USING GIN(secret_codes);
