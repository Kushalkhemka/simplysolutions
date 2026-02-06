-- Migration: Add refund tracking columns for email webhook
-- The email-refund webhook needs these columns to track refund details

-- Add refunded_at timestamp
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE;

-- Add refund_source to track how refund was detected
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS refund_source VARCHAR(50);
-- Values: 'email_webhook', 'mfn_sync', 'sp_api', 'manual'

-- Add index for refund queries
CREATE INDEX IF NOT EXISTS idx_amazon_orders_refunded ON amazon_orders(is_refunded) WHERE is_refunded = true;

-- Add comments
COMMENT ON COLUMN amazon_orders.refunded_at IS 'Timestamp when order was marked as refunded';
COMMENT ON COLUMN amazon_orders.refund_source IS 'Source that detected the refund: email_webhook, mfn_sync, sp_api, manual';
