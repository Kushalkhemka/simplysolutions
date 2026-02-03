-- Run this in Supabase SQL Editor to add the priority column
-- (Only needed if you ran the original migration before the priority feature was added)

-- Add priority column if it doesn't exist
ALTER TABLE amazon_seller_accounts 
ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100;

-- Create index on priority for efficient ordering
CREATE INDEX IF NOT EXISTS idx_seller_accounts_priority 
ON amazon_seller_accounts(priority ASC, created_at ASC);

-- Verify the column was added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'amazon_seller_accounts' 
ORDER BY ordinal_position;
