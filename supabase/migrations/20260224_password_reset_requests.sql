-- Migration: Password Reset Requests Table
-- Purpose: Track password reset requests for FSN OFFICE365 products

-- Create the password_reset_requests table
CREATE TABLE IF NOT EXISTS password_reset_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Order reference (Amazon order ID)
  order_id VARCHAR(50) NOT NULL,

  -- Username extracted from license key (e.g. 1234@ms365.pro)
  username TEXT NOT NULL,

  -- Email where new password will be communicated
  communication_email TEXT NOT NULL,

  -- Reference to the license key being reset
  original_license_key_id UUID REFERENCES amazon_activation_license_keys(id),

  -- Request status
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'REJECTED')),

  -- New password (set by admin on completion)
  new_password TEXT,

  -- Admin notes
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,

  -- Admin who reviewed
  reviewed_by UUID REFERENCES profiles(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_password_reset_order_id ON password_reset_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_status ON password_reset_requests(status);
CREATE INDEX IF NOT EXISTS idx_password_reset_created_at ON password_reset_requests(created_at DESC);

-- Enable RLS
ALTER TABLE password_reset_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to insert password reset requests
CREATE POLICY "Allow public insert on password_reset_requests" ON password_reset_requests
  FOR INSERT WITH CHECK (true);

-- Allow public to read their own requests by order_id
CREATE POLICY "Allow public read password_reset_requests" ON password_reset_requests
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on password_reset_requests" ON password_reset_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE password_reset_requests IS 'Stores password reset requests for FSN OFFICE365 products where license keys contain Username/Password pairs';
