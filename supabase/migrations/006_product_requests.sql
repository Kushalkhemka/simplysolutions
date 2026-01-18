-- Migration: Product Requests Table
-- Purpose: Track AutoCAD, Canva, Revit, Fusion360, and Office 365 E5 subscription requests

-- Create the product_requests table
CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Customer information
  email TEXT NOT NULL,
  mobile_number VARCHAR(20),
  
  -- Product and order reference
  fsn VARCHAR(100) NOT NULL,
  order_id VARCHAR(50),
  
  -- Request type derived from FSN
  request_type VARCHAR(30) GENERATED ALWAYS AS (
    CASE 
      WHEN fsn ILIKE 'AUTOCAD%' THEN 'autocad'
      WHEN fsn ILIKE 'CANVA%' THEN 'canva'
      WHEN fsn ILIKE 'REVIT%' THEN 'revit'
      WHEN fsn ILIKE 'FUSION360%' THEN 'fusion360'
      WHEN fsn ILIKE '365E5%' OR fsn = '365E5' THEN '365e5'
      ELSE 'other'
    END
  ) STORED,
  
  -- Status tracking
  is_completed BOOLEAN DEFAULT false,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  
  -- Notes for admin
  admin_notes TEXT
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_product_requests_email ON product_requests(email);
CREATE INDEX IF NOT EXISTS idx_product_requests_order_id ON product_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_fsn ON product_requests(fsn);
CREATE INDEX IF NOT EXISTS idx_product_requests_request_type ON product_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_product_requests_is_completed ON product_requests(is_completed);

-- Enable RLS
ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow public insert on product_requests" ON product_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow service role full access on product_requests" ON product_requests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Comment on table
COMMENT ON TABLE product_requests IS 'Stores subscription product requests (AutoCAD, Canva, 365 E5, etc.) that require manual fulfillment';
