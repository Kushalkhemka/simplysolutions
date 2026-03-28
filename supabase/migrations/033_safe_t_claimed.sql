-- Add safe_t_claimed column to track orders where Safe-T claim has been filed
ALTER TABLE amazon_orders ADD COLUMN IF NOT EXISTS safe_t_claimed BOOLEAN DEFAULT FALSE;
ALTER TABLE amazon_orders ADD COLUMN IF NOT EXISTS safe_t_claimed_at TIMESTAMPTZ DEFAULT NULL;
