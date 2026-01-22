-- Migration: License Replacement Requests Table
-- Purpose: Track license key replacement requests from customers

-- Create the license_replacement_requests table
CREATE TABLE IF NOT EXISTS license_replacement_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id VARCHAR(50) NOT NULL,
  
  -- Customer email for notifications
  customer_email VARCHAR(255) NOT NULL,
  
  -- Product FSN (for reference)
  fsn VARCHAR(50),
  
  -- License key references
  original_license_key_id UUID REFERENCES amazon_activation_license_keys(id),
  new_license_key_id UUID REFERENCES amazon_activation_license_keys(id),
  
  -- Screenshot proof URL (stored in Supabase Storage)
  screenshot_url TEXT NOT NULL,
  
  -- Request status (PENDING, APPROVED, REJECTED)
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- Admin notes for rejection reason or approval notes
  admin_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  
  -- Admin who reviewed
  reviewed_by UUID REFERENCES profiles(id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_license_replacement_order_id ON license_replacement_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_license_replacement_status ON license_replacement_requests(status);
CREATE INDEX IF NOT EXISTS idx_license_replacement_created_at ON license_replacement_requests(created_at DESC);

-- Enable RLS
ALTER TABLE license_replacement_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow public to insert replacement requests
CREATE POLICY "Allow public insert on license_replacement_requests" ON license_replacement_requests
  FOR INSERT WITH CHECK (true);

-- Allow public to read their own requests by order_id
CREATE POLICY "Allow public read own replacement requests" ON license_replacement_requests
  FOR SELECT USING (true);

-- Allow service role full access
CREATE POLICY "Allow service role full access on license_replacement_requests" ON license_replacement_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE license_replacement_requests IS 'Stores license key replacement requests with screenshot proofs for admin review';
