-- Complete Migration: Apply all new tables for Amazon Activation System
-- Run this in Supabase SQL Editor to apply all schema changes at once

-- ============================================================
-- 1. Add columns to amazon_secret_codes for GetCID tracking
-- ============================================================
ALTER TABLE amazon_secret_codes 
ADD COLUMN IF NOT EXISTS getcid_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS getcid_used_at TIMESTAMPTZ;

COMMENT ON COLUMN amazon_secret_codes.getcid_used IS 'Whether this secret code has been used for GetCID (Confirmation ID) generation';

-- ============================================================
-- 2. Add columns to amazon_activation_license_keys for legacy import
-- ============================================================
ALTER TABLE amazon_activation_license_keys 
ADD COLUMN IF NOT EXISTS original_key VARCHAR(50),
ADD COLUMN IF NOT EXISTS supported_os TEXT,
ADD COLUMN IF NOT EXISTS legacy_fsn VARCHAR(100),
ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_amazon_keys_original_key ON amazon_activation_license_keys(original_key);
CREATE INDEX IF NOT EXISTS idx_amazon_keys_legacy_fsn ON amazon_activation_license_keys(legacy_fsn);

-- ============================================================
-- 3. Create amazon_orders table
-- ============================================================
CREATE TABLE IF NOT EXISTS amazon_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL,
  confirmation_id VARCHAR(50),
  contact_email TEXT,
  contact_phone VARCHAR(20),
  fsn VARCHAR(100),
  license_key_id UUID REFERENCES amazon_activation_license_keys(id),
  secret_code_id UUID REFERENCES amazon_secret_codes(id),
  warranty_status VARCHAR(20) DEFAULT 'PENDING' CHECK (warranty_status IN ('PENDING', 'APPROVED', 'REJECTED')),
  installation_id TEXT,
  fulfillment_type VARCHAR(20) DEFAULT 'amazon_digital',
  getcid_used BOOLEAN DEFAULT false,
  getcid_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_amazon_orders_order_id ON amazon_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_confirmation_id ON amazon_orders(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_amazon_orders_fsn ON amazon_orders(fsn);

ALTER TABLE amazon_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read on amazon_orders" ON amazon_orders FOR SELECT USING (true);
CREATE POLICY "Allow service role full access on amazon_orders" ON amazon_orders FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 4. Create product_requests table
-- ============================================================
CREATE TABLE IF NOT EXISTS product_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  fsn VARCHAR(100),
  mobile_number VARCHAR(20),
  order_id VARCHAR(50),
  request_type VARCHAR(30),
  is_completed BOOLEAN DEFAULT false,
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_product_requests_email ON product_requests(email);
CREATE INDEX IF NOT EXISTS idx_product_requests_order_id ON product_requests(order_id);
CREATE INDEX IF NOT EXISTS idx_product_requests_request_type ON product_requests(request_type);
CREATE INDEX IF NOT EXISTS idx_product_requests_is_completed ON product_requests(is_completed);

ALTER TABLE product_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on product_requests" ON product_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role full access on product_requests" ON product_requests FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 5. Create warranty_registrations table
-- ============================================================
CREATE TABLE IF NOT EXISTS warranty_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL,
  contact VARCHAR(50),
  status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (status IN ('PROCESSING', 'VERIFIED', 'REJECTED')),
  screenshot_seller_feedback TEXT,
  screenshot_product_review TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_warranty_registrations_order_id ON warranty_registrations(order_id);
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_status ON warranty_registrations(status);

ALTER TABLE warranty_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on warranty_registrations" ON warranty_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public read on warranty_registrations" ON warranty_registrations FOR SELECT USING (true);
CREATE POLICY "Allow service role full access on warranty_registrations" ON warranty_registrations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 6. Create office365_customizations table
-- ============================================================
CREATE TABLE IF NOT EXISTS office365_customizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(50) NOT NULL,
  display_name TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  address TEXT,
  phone_number VARCHAR(20),
  is_completed BOOLEAN DEFAULT false,
  generated_email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_office365_customizations_order_id ON office365_customizations(order_id);
CREATE INDEX IF NOT EXISTS idx_office365_customizations_is_completed ON office365_customizations(is_completed);

ALTER TABLE office365_customizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public insert on office365_customizations" ON office365_customizations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow service role full access on office365_customizations" ON office365_customizations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- 7. Create getcid_usage table
-- ============================================================
CREATE TABLE IF NOT EXISTS getcid_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier VARCHAR(50) NOT NULL,
  identifier_type VARCHAR(20) NOT NULL CHECK (identifier_type IN ('secret_code', 'order_id')),
  installation_id TEXT NOT NULL,
  confirmation_id TEXT,
  api_response TEXT,
  api_status VARCHAR(30),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_getcid_usage_identifier ON getcid_usage(identifier);
CREATE INDEX IF NOT EXISTS idx_getcid_usage_created_at ON getcid_usage(created_at);

ALTER TABLE getcid_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access on getcid_usage" ON getcid_usage FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Done! All tables created successfully
-- ============================================================
