-- Migration: Add missing columns to amazon_orders for admin console
-- Simplified: reuse existing contact_email/phone, no redundant columns

-- ============================================
-- 1. Activation Issues (Key Not Available)
-- ============================================
-- When customer tries to generate key but none available,
-- they submit their contact info (reuses existing contact_email/contact_phone)
-- and we notify them when keys are added

ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS has_activation_issue BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS issue_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS issue_created_at TIMESTAMPTZ;

-- Create index for activation issues queries
CREATE INDEX IF NOT EXISTS idx_amazon_orders_activation_issue 
ON amazon_orders(has_activation_issue, issue_status) 
WHERE has_activation_issue = true;

-- ============================================
-- 2. Fraud Management Columns
-- ============================================

ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS fraud_reason VARCHAR(50),
ADD COLUMN IF NOT EXISTS fraud_marked_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS is_returned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS returned_at TIMESTAMPTZ;

-- Create index for fraud queries
CREATE INDEX IF NOT EXISTS idx_amazon_orders_fraud 
ON amazon_orders(is_fraud, fraud_marked_at) 
WHERE is_fraud = true;

-- ============================================
-- 3. Blocked IPs Table (for fraud prevention)
-- ============================================

CREATE TABLE IF NOT EXISTS blocked_ips (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address VARCHAR(45) UNIQUE NOT NULL,
    reason TEXT,
    order_id VARCHAR(50),
    blocked_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blocked_ips_address ON blocked_ips(ip_address);

ALTER TABLE blocked_ips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on blocked_ips" 
ON blocked_ips FOR SELECT USING (true);

CREATE POLICY "Service role full access on blocked_ips" 
ON blocked_ips FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================
-- 4. Comments
-- ============================================

COMMENT ON COLUMN amazon_orders.has_activation_issue IS 'True when key generation failed due to no available keys';
COMMENT ON COLUMN amazon_orders.issue_status IS 'pending (awaiting keys) or resolved (key assigned)';
-- contact_email and contact_phone already exist and are reused for issue notification

DO $$
BEGIN
    RAISE NOTICE 'Migration completed: Added activation issues and fraud columns';
    RAISE NOTICE 'Using existing contact_email/contact_phone for customer notification';
END $$;
