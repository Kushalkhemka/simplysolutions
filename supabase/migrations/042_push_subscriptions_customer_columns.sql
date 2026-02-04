-- Migration: Add customer-related columns to push_subscriptions table
-- This migration adds columns needed for customer push notification subscriptions

-- Add is_customer column if not exists
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS is_customer BOOLEAN DEFAULT FALSE;

-- Add order_id column for linking customer subscriptions to orders
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS order_id VARCHAR(50);

-- Add notification type columns
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS notify_replacement_status BOOLEAN DEFAULT FALSE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS notify_product_request_status BOOLEAN DEFAULT FALSE;
ALTER TABLE push_subscriptions ADD COLUMN IF NOT EXISTS notify_warranty_status BOOLEAN DEFAULT FALSE;

-- Create index for customer subscriptions lookup
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_is_customer ON push_subscriptions(is_customer) WHERE is_customer = true;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_order ON push_subscriptions(order_id) WHERE order_id IS NOT NULL;

-- Add comments
COMMENT ON COLUMN push_subscriptions.is_customer IS 'Indicates if this subscription is from a customer (vs admin)';
COMMENT ON COLUMN push_subscriptions.order_id IS 'Order ID for customer subscription notifications';
COMMENT ON COLUMN push_subscriptions.notify_replacement_status IS 'Notify when replacement request status changes';
COMMENT ON COLUMN push_subscriptions.notify_product_request_status IS 'Notify when product request status changes';
COMMENT ON COLUMN push_subscriptions.notify_warranty_status IS 'Notify when warranty status changes';
