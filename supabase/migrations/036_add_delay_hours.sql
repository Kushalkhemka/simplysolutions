-- Migration: Add delay_hours column to fba_state_delays
-- This allows for more flexible delay configuration (e.g., 6 hours for Delhi)

-- Add delay_hours column
ALTER TABLE fba_state_delays 
ADD COLUMN IF NOT EXISTS delay_hours INTEGER;

-- Migrate existing delay_days to delay_hours (1 day = 24 hours)
UPDATE fba_state_delays 
SET delay_hours = delay_days * 24 
WHERE delay_hours IS NULL AND delay_days IS NOT NULL;

-- Set default for new entries without delay_hours
UPDATE fba_state_delays 
SET delay_hours = 96 
WHERE delay_hours IS NULL;

-- Make delay_hours NOT NULL after migration
ALTER TABLE fba_state_delays 
ALTER COLUMN delay_hours SET NOT NULL;

-- Add default value for future inserts
ALTER TABLE fba_state_delays 
ALTER COLUMN delay_hours SET DEFAULT 96;

-- Create index on delay_hours for performance
CREATE INDEX IF NOT EXISTS idx_fba_state_delays_delay_hours 
ON fba_state_delays(delay_hours);

-- Note: delay_days column is kept for backward compatibility but delay_hours is now the source of truth
