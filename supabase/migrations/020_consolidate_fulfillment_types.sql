-- Migration: Consolidate fulfillment types
-- Date: 2026-01-20
-- Purpose: Standardize fulfillment_type values - consolidate amazon_merchant → amazon_mfn
--
-- Fulfillment types after this migration:
--   - amazon_fba: Fulfilled by Amazon (FBA)
--   - amazon_mfn: Merchant Fulfilled Network (seller ships)
--   - amazon_digital: Digital delivery via secret code

-- 1. Update all amazon_merchant to amazon_mfn
UPDATE amazon_orders
SET fulfillment_type = 'amazon_mfn'
WHERE fulfillment_type = 'amazon_merchant';

-- 2. Add a check constraint to ensure only valid fulfillment types (optional)
-- Commented out in case there are other edge cases
-- ALTER TABLE amazon_orders
-- ADD CONSTRAINT valid_fulfillment_type 
-- CHECK (fulfillment_type IN ('amazon_fba', 'amazon_mfn', 'amazon_digital'));

-- 3. Show results
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM amazon_orders 
    WHERE fulfillment_type = 'amazon_mfn';
    
    RAISE NOTICE 'Total amazon_mfn orders after consolidation: %', updated_count;
END $$;

-- Add comment for documentation
COMMENT ON COLUMN amazon_orders.fulfillment_type IS 'Fulfillment type: amazon_fba (FBA), amazon_mfn (Merchant/Seller fulfills), amazon_digital (Digital codes)';
