-- FBA Early Delivery Appeals System - Database Migration
-- Run this in Supabase SQL Editor

-- 1. Add early appeal tracking to amazon_orders
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS early_appeal_status VARCHAR(20) DEFAULT NULL;
-- Values: NULL (no appeal), 'PENDING', 'APPROVED', 'REJECTED'

ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS early_appeal_at TIMESTAMP WITH TIME ZONE;

-- Add refund tracking (since Amazon SP-API doesn't include refund status in order details)
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS is_refunded BOOLEAN DEFAULT FALSE;

-- Add review request tracking
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS review_requested_at TIMESTAMP WITH TIME ZONE;


-- 2. Create state delays configuration table
CREATE TABLE IF NOT EXISTS fba_state_delays (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    state_name VARCHAR(100) NOT NULL UNIQUE,
    delay_days INTEGER NOT NULL DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert default values for Indian states
INSERT INTO fba_state_delays (state_name, delay_days) VALUES
('DELHI', 2),
('NEW DELHI', 2),
('MAHARASHTRA', 2),
('KARNATAKA', 2),
('TAMIL NADU', 2),
('TELANGANA', 2),
('WEST BENGAL', 2),
('GUJARAT', 2),
('UTTAR PRADESH', 3),
('RAJASTHAN', 3),
('MADHYA PRADESH', 3),
('KERALA', 3),
('PUNJAB', 3),
('HARYANA', 2),
('BIHAR', 4),
('ODISHA', 4),
('JHARKHAND', 4),
('CHHATTISGARH', 4),
('ASSAM', 5),
('JAMMU AND KASHMIR', 5),
('HIMACHAL PRADESH', 4),
('UTTARAKHAND', 4),
('GOA', 3),
('ANDHRA PRADESH', 3),
('CHANDIGARH', 2),
('PUDUCHERRY', 3),
('TRIPURA', 5),
('MEGHALAYA', 5),
('MANIPUR', 5),
('MIZORAM', 5),
('ARUNACHAL PRADESH', 5),
('NAGALAND', 5),
('SIKKIM', 5),
('LADAKH', 6),
('ANDAMAN AND NICOBAR ISLANDS', 7),
('LAKSHADWEEP', 7),
('DADRA AND NAGAR HAVELI AND DAMAN AND DIU', 4)
ON CONFLICT (state_name) DO NOTHING;

-- 4. Create early appeals table
CREATE TABLE IF NOT EXISTS fba_early_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id VARCHAR(200) NOT NULL,
    customer_email TEXT NOT NULL,
    customer_whatsapp VARCHAR(20) NOT NULL,
    proof_image_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    -- Values: 'PENDING', 'APPROVED', 'REJECTED'
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fba_early_appeals_status ON fba_early_appeals(status);
CREATE INDEX IF NOT EXISTS idx_fba_early_appeals_order ON fba_early_appeals(order_id);
CREATE INDEX IF NOT EXISTS idx_fba_state_delays_state ON fba_state_delays(state_name);

-- 5. Ensure synced_at is set for existing FBA orders
-- This is needed for the dynamic redeemable date calculation
-- For existing orders without synced_at, use their created_at or order_date
UPDATE amazon_orders 
SET synced_at = COALESCE(synced_at, created_at, order_date, NOW())
WHERE fulfillment_type = 'amazon_fba' 
  AND synced_at IS NULL;

-- Note: redeemable_at is calculated DYNAMICALLY at activation time
-- using synced_at + state delay from fba_state_delays table
-- This ensures admin changes to delay settings take effect immediately

-- Verify changes
SELECT 'fba_state_delays' as table_name, COUNT(*) as row_count FROM fba_state_delays
UNION ALL
SELECT 'fba_early_appeals', COUNT(*) FROM fba_early_appeals;
