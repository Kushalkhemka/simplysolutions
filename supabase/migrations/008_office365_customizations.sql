-- Migration: Office 365 Customizations Table
-- Purpose: Store user details for creating customized Office 365 E5 accounts

-- Create the office365_customizations table
CREATE TABLE IF NOT EXISTS office365_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order reference
  order_id VARCHAR(50) NOT NULL,
  
  -- User details for account creation
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  
  -- Address for account profile
  address TEXT,
  
  -- Contact
  phone_number VARCHAR(20),
  
  -- Fulfillment status
  is_customized BOOLEAN DEFAULT false,
  
  -- Generated credentials (stored encrypted or sent via email)
  generated_email TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  customized_at TIMESTAMPTZ,
  
  -- Constraints
  UNIQUE(order_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_office365_customizations_order_id ON office365_customizations(order_id);
CREATE INDEX IF NOT EXISTS idx_office365_customizations_is_customized ON office365_customizations(is_customized);
CREATE INDEX IF NOT EXISTS idx_office365_customizations_phone ON office365_customizations(phone_number);

-- Enable RLS
ALTER TABLE office365_customizations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public insert on office365_customizations" ON office365_customizations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role full access on office365_customizations" ON office365_customizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE office365_customizations IS 'Stores user details for Office 365 E5 account customization requests';
