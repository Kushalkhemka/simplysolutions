-- Migration: Make user_id nullable for customer push subscriptions
-- Customers may not be logged in when subscribing to push notifications

-- Step 1: Drop the existing NOT NULL constraint on user_id
ALTER TABLE push_subscriptions ALTER COLUMN user_id DROP NOT NULL;

-- Step 2: Drop the existing unique constraint that depends on user_id
ALTER TABLE push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_endpoint_key;

-- Step 3: Create a new unique constraint on just the endpoint (each device can only have one subscription)
ALTER TABLE push_subscriptions ADD CONSTRAINT push_subscriptions_endpoint_key UNIQUE (endpoint);

-- Step 4: Add index for faster customer subscription lookups
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_customer ON push_subscriptions(is_customer) WHERE is_customer = true;

-- Step 5: Add comment explaining the change
COMMENT ON COLUMN push_subscriptions.user_id IS 'User ID is optional - null for unauthenticated customer subscriptions';
