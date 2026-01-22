-- Migration: Office 365 Enterprise Requests Table
-- Purpose: Store user details for Office 365 E5 enterprise requests with custom username prefix

-- Create the office365_requests table
CREATE TABLE IF NOT EXISTS office365_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id VARCHAR(50) NOT NULL UNIQUE,
  
  -- Customer information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  username_prefix TEXT NOT NULL,
  whatsapp_number VARCHAR(20) NOT NULL,
  email TEXT NOT NULL,
  
  -- Generated credentials (set by admin on completion)
  generated_email TEXT,
  generated_password TEXT,
  
  -- Status tracking
  is_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_office365_requests_order_id ON office365_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_office365_requests_is_completed ON office365_requests(is_completed);
CREATE INDEX IF NOT EXISTS idx_office365_requests_email ON office365_requests(email);
CREATE INDEX IF NOT EXISTS idx_office365_requests_whatsapp ON office365_requests(whatsapp_number);

-- Enable RLS
ALTER TABLE office365_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public insert on office365_requests" ON office365_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role full access on office365_requests" ON office365_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE office365_requests IS 'Stores Office 365 E5 enterprise subscription requests with custom username preferences';
