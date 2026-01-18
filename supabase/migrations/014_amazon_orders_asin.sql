-- Migration: Add ASIN and product_type columns to amazon_orders
-- Enables Amazon SP-API order sync with ASIN-based product lookup

-- Add new columns for Amazon SP-API integration
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS asin VARCHAR(20),
ADD COLUMN IF NOT EXISTS product_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS product_title TEXT,
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS order_total DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT 'INR',
ADD COLUMN IF NOT EXISTS order_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS order_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS buyer_email TEXT,
ADD COLUMN IF NOT EXISTS city VARCHAR(100),
ADD COLUMN IF NOT EXISTS state VARCHAR(100),
ADD COLUMN IF NOT EXISTS postal_code VARCHAR(20),
ADD COLUMN IF NOT EXISTS country VARCHAR(10) DEFAULT 'IN',
ADD COLUMN IF NOT EXISTS installation_doc VARCHAR(100),
ADD COLUMN IF NOT EXISTS synced_at TIMESTAMPTZ;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_amazon_orders_asin ON amazon_orders(asin);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_product_type ON amazon_orders(product_type);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_order_date ON amazon_orders(order_date);

-- Comments
COMMENT ON COLUMN amazon_orders.asin IS 'Amazon Standard Identification Number from SP-API';
COMMENT ON COLUMN amazon_orders.product_type IS 'Normalized product type from ASIN mapping';
COMMENT ON COLUMN amazon_orders.synced_at IS 'Timestamp when order was synced from Amazon SP-API';
