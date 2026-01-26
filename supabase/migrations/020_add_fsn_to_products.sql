-- Migration: Add FSN column to products table for activation system
-- Maps SimplySolutions products to Amazon FSN codes for license key activation

-- Add FSN column
ALTER TABLE products ADD COLUMN IF NOT EXISTS fsn VARCHAR(50);

-- Create index on FSN for fast lookups
CREATE INDEX IF NOT EXISTS idx_products_fsn ON products(fsn);

-- Add comment
COMMENT ON COLUMN products.fsn IS 'Amazon FSN code for activation system mapping';
