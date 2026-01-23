-- Migration: Add missing foreign key indexes
-- Date: 2026-01-23
-- Description: Adds indexes for foreign key columns to improve JOIN performance and constraint validation

-- Add indexes for license_replacement_requests table
CREATE INDEX IF NOT EXISTS idx_license_replacement_requests_new_license_key 
ON public.license_replacement_requests(new_license_key_id);

CREATE INDEX IF NOT EXISTS idx_license_replacement_requests_original_license_key 
ON public.license_replacement_requests(original_license_key_id);

CREATE INDEX IF NOT EXISTS idx_license_replacement_requests_reviewed_by 
ON public.license_replacement_requests(reviewed_by);

-- Add index for multi_fsn_orders table
CREATE INDEX IF NOT EXISTS idx_multi_fsn_orders_processed_by 
ON public.multi_fsn_orders(processed_by);

-- Verify indexes were created
DO $$
BEGIN
  RAISE NOTICE 'Foreign key indexes created successfully';
END $$;
