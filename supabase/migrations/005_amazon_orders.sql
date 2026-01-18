-- Migration: Amazon Orders Table
-- Purpose: Store order information for activation lookups and link to license keys

-- Create the amazon_orders table
CREATE TABLE IF NOT EXISTS amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Order identifiers
  order_id VARCHAR(50) NOT NULL,
  confirmation_id VARCHAR(50),
  
  -- Contact information
  contact_email TEXT,
  contact_phone VARCHAR(20),
  
  -- Product reference
  fsn VARCHAR(100),
  
  -- Links to license keys and secret codes
  license_key_id UUID REFERENCES amazon_activation_license_keys(id),
  secret_code_id UUID REFERENCES amazon_secret_codes(id),
  
  -- Warranty tracking
  warranty_status VARCHAR(20) DEFAULT 'PENDING' CHECK (warranty_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  
  -- Phone activation support
  installation_id TEXT,
  
  -- Fulfillment type: amazon_fba (physical) or amazon_digital (instant delivery)
  fulfillment_type VARCHAR(20) DEFAULT 'amazon_digital',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  UNIQUE(order_id)
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_amazon_orders_order_id ON amazon_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_confirmation_id ON amazon_orders(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_license_key_id ON amazon_orders(license_key_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_fsn ON amazon_orders(fsn);

-- Enable RLS
ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public read on amazon_orders" ON amazon_orders
  FOR SELECT USING (true);

CREATE POLICY "Allow service role full access on amazon_orders" ON amazon_orders
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE amazon_orders IS 'Stores Amazon/Flipkart order information for activation and warranty tracking';
