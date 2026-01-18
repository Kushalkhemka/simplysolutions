-- ============================================================
-- FIX: Update Office 2021 FSN to correct value
-- Run this in Supabase SQL Editor
-- ============================================================

-- Update Office 2021 Pro Plus ASINs to use correct FSN
UPDATE amazon_asin_mapping 
SET fsn = 'OFFG9MREFCXD658G'
WHERE asin IN ('B0GFCYYX99', 'B0GFCXTRX8', 'B0GFCVX9N5');

-- Verify
SELECT asin, fsn, product_title 
FROM amazon_asin_mapping 
WHERE fsn = 'OFFG9MREFCXD658G';
