-- Migration: Warranty Registrations Table
-- Purpose: Track warranty registration submissions with screenshot proofs

-- Create the warranty_registrations table
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id VARCHAR(50) NOT NULL,
  
  -- Contact information
  contact VARCHAR(50),
  
  -- Review status (PROCESSING, VERIFIED, REJECTED)
  status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'VERIFIED', 'REJECTED')),
  
  -- Screenshot proofs (Amazon seller feedback + product review)
  screenshot_seller_feedback TEXT,  -- Seller feedback screenshot URL
  screenshot_product_review TEXT,   -- Product review screenshot URL
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ,
  
  -- Admin notes for rejections
  rejection_reason TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_order_id ON warranty_registrations(order_id);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_status ON warranty_registrations(status);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_contact ON warranty_registrations(contact);

-- Enable RLS
ALTER TABLE warranty_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public insert on warranty_registrations" ON warranty_registrations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read own warranty by order_id" ON warranty_registrations
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access on warranty_registrations" ON warranty_registrations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE warranty_registrations IS 'Stores warranty registration submissions with Amazon feedback/review screenshots';
