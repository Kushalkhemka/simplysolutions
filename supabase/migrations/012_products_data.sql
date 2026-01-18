-- Migration: Create products_data table for Amazon FSN product mapping
-- This is separate from the main products table to avoid duplicates
-- Contains FSN codes, download links, and installation doc references

CREATE TABLE IF NOT EXISTS products_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fsn VARCHAR(50) UNIQUE NOT NULL,
    product_title TEXT NOT NULL,
    download_link TEXT,
    product_image TEXT,
    original_image_url TEXT,
    installation_doc VARCHAR(100),
    slug VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on FSN for fast lookups
CREATE INDEX idx_products_data_fsn ON products_data(fsn);

-- Add comments
COMMENT ON TABLE products_data IS 'Amazon product data with FSN codes for activation system';
COMMENT ON COLUMN products_data.fsn IS 'Amazon FSN code - unique identifier for product';
COMMENT ON COLUMN products_data.download_link IS 'Direct download link for product installer';
COMMENT ON COLUMN products_data.installation_doc IS 'Filename of installation doc in /installation_docs';

-- Enable RLS
ALTER TABLE products_data ENABLE ROW LEVEL SECURITY;

-- Allow read access for all (needed for activation pages)
CREATE POLICY "Allow public read access to products_data"
ON products_data FOR SELECT
USING (true);

-- Only service role can insert/update
CREATE POLICY "Only service role can modify products_data"
ON products_data FOR ALL
USING (auth.role() = 'service_role');
