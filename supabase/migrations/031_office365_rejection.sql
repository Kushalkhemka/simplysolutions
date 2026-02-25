-- Migration: Add rejection support to office365_customizations
-- Allows admin to reject requests and customers to resubmit

ALTER TABLE office365_customizations ADD COLUMN IF NOT EXISTS is_rejected BOOLEAN DEFAULT false;
ALTER TABLE office365_customizations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE office365_customizations ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMPTZ;

-- Index for rejected status filtering
CREATE INDEX IF NOT EXISTS idx_office365_customizations_is_rejected ON office365_customizations(is_rejected);
