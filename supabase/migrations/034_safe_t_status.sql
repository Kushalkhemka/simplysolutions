-- Add safe_t_status column for more granular tracking
-- Values: null (pending), 'ineligible', 'filed', 'claimed', 'rejected'
ALTER TABLE amazon_orders ADD COLUMN IF NOT EXISTS safe_t_status TEXT DEFAULT NULL;
