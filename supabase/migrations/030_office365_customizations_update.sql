-- Migration: Update office365_customizations table for Request Customization feature
-- Adds username_prefix column and customer_email for tracking

-- Add username_prefix column
ALTER TABLE office365_customizations ADD COLUMN IF NOT EXISTS username_prefix TEXT;

-- Add customer_email column
ALTER TABLE office365_customizations ADD COLUMN IF NOT EXISTS customer_email TEXT;

-- Create unique index on username_prefix (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_office365_customizations_username_prefix 
  ON office365_customizations(username_prefix) WHERE username_prefix IS NOT NULL;
