-- Migration: Add getcid tracking columns to existing tables
-- Purpose: Track whether an identifier has been used for GetCID requests

-- Add getcid_used flag to amazon_secret_codes (for digital delivery orders)
ALTER TABLE amazon_secret_codes 
ADD COLUMN IF NOT EXISTS getcid_used BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS getcid_used_at TIMESTAMPTZ;

-- Comment on columns
COMMENT ON COLUMN amazon_secret_codes.getcid_used IS 'Whether this secret code has been used for GetCID (Confirmation ID) generation';
