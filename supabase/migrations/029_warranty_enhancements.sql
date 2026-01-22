-- Migration: Warranty Enhancements
-- Purpose: Add email, resubmission support, and order details to warranty registrations

-- Add new columns
ALTER TABLE warranty_registrations
ADD COLUMN IF NOT EXISTS customer_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS missing_seller_feedback BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS missing_product_review BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS admin_notes TEXT,
ADD COLUMN IF NOT EXISTS product_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS purchase_date DATE;

-- Update status constraint to include NEEDS_RESUBMISSION
-- First drop the existing constraint
ALTER TABLE warranty_registrations DROP CONSTRAINT IF EXISTS warranty_registrations_status_check;

-- Add new constraint with NEEDS_RESUBMISSION status
ALTER TABLE warranty_registrations ADD CONSTRAINT warranty_registrations_status_check 
CHECK (status IN ('PROCESSING', 'VERIFIED', 'REJECTED', 'NEEDS_RESUBMISSION'));

-- Create index on customer_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_warranty_registrations_email ON warranty_registrations(customer_email);

-- Comment on new columns
COMMENT ON COLUMN warranty_registrations.customer_email IS 'Customer email for warranty communications';
COMMENT ON COLUMN warranty_registrations.missing_seller_feedback IS 'Admin flag indicating seller feedback screenshot is missing/invalid';
COMMENT ON COLUMN warranty_registrations.missing_product_review IS 'Admin flag indicating product review screenshot is missing/invalid';
COMMENT ON COLUMN warranty_registrations.admin_notes IS 'Admin notes for rejection or resubmission requests';
COMMENT ON COLUMN warranty_registrations.product_name IS 'Product name from order lookup';
COMMENT ON COLUMN warranty_registrations.quantity IS 'Order quantity';
COMMENT ON COLUMN warranty_registrations.purchase_date IS 'Order purchase date';
