-- Amazon Activation System Migration
-- Run this in Supabase SQL Editor

-- Table: amazon_activation_license_keys  
-- Stores license keys available for Amazon activations (create this first due to FK reference)
CREATE TABLE IF NOT EXISTS amazon_activation_license_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key VARCHAR(50) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  product_name VARCHAR(255),
  product_image VARCHAR(500),
  download_url VARCHAR(500),
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: amazon_secret_codes
-- Stores the 15-digit secret codes sent to Amazon buyers
CREATE TABLE IF NOT EXISTS amazon_secret_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  secret_code VARCHAR(20) NOT NULL UNIQUE,
  sku VARCHAR(50) NOT NULL,
  license_key_id UUID REFERENCES amazon_activation_license_keys(id),
  is_redeemed BOOLEAN DEFAULT FALSE,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_amazon_secret_codes_code ON amazon_secret_codes(secret_code);
CREATE INDEX IF NOT EXISTS idx_amazon_secret_codes_sku ON amazon_secret_codes(sku);
CREATE INDEX IF NOT EXISTS idx_amazon_license_keys_sku ON amazon_activation_license_keys(sku);
CREATE INDEX IF NOT EXISTS idx_amazon_license_keys_available ON amazon_activation_license_keys(sku, is_redeemed) WHERE is_redeemed = FALSE;

-- Enable RLS (Row Level Security)
ALTER TABLE amazon_secret_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE amazon_activation_license_keys ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (needed for activation flow)
CREATE POLICY "Allow public read on amazon_secret_codes" ON amazon_secret_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow public read on amazon_activation_license_keys" ON amazon_activation_license_keys
  FOR SELECT USING (true);

-- Service role can do everything (for API routes using service role key)
CREATE POLICY "Service role full access on amazon_secret_codes" ON amazon_secret_codes
  FOR ALL USING (true);

CREATE POLICY "Service role full access on amazon_activation_license_keys" ON amazon_activation_license_keys
  FOR ALL USING (true);

-- Sample test data (optional - remove in production)
-- INSERT INTO amazon_activation_license_keys (license_key, sku, product_name, product_image, download_url)
-- VALUES 
--   ('XXXXX-XXXXX-XXXXX-XXXXX-XXXXX', 'OFFICE2021-WIN', 'Microsoft Office Professional Plus 2021', '/images/office2021.png', 'https://example.com/download'),
--   ('YYYYY-YYYYY-YYYYY-YYYYY-YYYYY', 'OFFICE2021-WIN', 'Microsoft Office Professional Plus 2021', '/images/office2021.png', 'https://example.com/download');

-- INSERT INTO amazon_secret_codes (secret_code, sku)
-- VALUES 
--   ('123456789012345', 'OFFICE2021-WIN'),
--   ('987654321098765', 'OFFICE2021-WIN');
