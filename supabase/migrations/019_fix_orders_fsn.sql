-- ============================================================
-- Migration: Fix existing amazon_orders FSN values
-- Updates orders that have ASIN but incorrect/missing FSN
-- ============================================================

-- Step 1: Add asin column if it doesn't exist (for tracking)
ALTER TABLE amazon_orders 
ADD COLUMN IF NOT EXISTS asin VARCHAR(20);

-- Step 2: Create index on asin for faster lookups
CREATE INDEX IF NOT EXISTS idx_amazon_orders_asin ON amazon_orders(asin);

-- Step 3: Update FSN for orders that have ASIN and matching mapping exists
-- This will update any orders where we can find a matching ASIN in the mapping table
UPDATE amazon_orders ao
SET fsn = am.fsn
FROM amazon_asin_mapping am
WHERE ao.asin = am.asin
  AND ao.asin IS NOT NULL
  AND (ao.fsn IS NULL OR ao.fsn = '' OR ao.fsn != am.fsn);

-- Step 4: Log results
DO $$
DECLARE
    updated_count INTEGER;
    missing_asin_count INTEGER;
    unmapped_asin_count INTEGER;
BEGIN
    -- Count orders that were updated
    SELECT COUNT(*) INTO updated_count
    FROM amazon_orders ao
    INNER JOIN amazon_asin_mapping am ON ao.asin = am.asin
    WHERE ao.fsn = am.fsn;
    
    -- Count orders missing ASIN
    SELECT COUNT(*) INTO missing_asin_count
    FROM amazon_orders
    WHERE asin IS NULL OR asin = '';
    
    -- Count orders with ASIN but no mapping
    SELECT COUNT(*) INTO unmapped_asin_count
    FROM amazon_orders ao
    WHERE ao.asin IS NOT NULL 
      AND ao.asin != ''
      AND NOT EXISTS (SELECT 1 FROM amazon_asin_mapping am WHERE am.asin = ao.asin);
    
    RAISE NOTICE 'FSN Update Complete:';
    RAISE NOTICE '  - Orders with correct FSN: %', updated_count;
    RAISE NOTICE '  - Orders missing ASIN: %', missing_asin_count;
    RAISE NOTICE '  - Orders with unmapped ASIN: %', unmapped_asin_count;
END $$;

-- Step 5: Show orders that need manual review (missing ASIN or unmapped)
SELECT 
    'Orders needing review:' as note,
    order_id,
    asin,
    fsn,
    fulfillment_type,
    created_at
FROM amazon_orders
WHERE (asin IS NULL OR asin = '')
   OR (asin IS NOT NULL AND NOT EXISTS (
       SELECT 1 FROM amazon_asin_mapping am WHERE am.asin = amazon_orders.asin
   ))
ORDER BY created_at DESC
LIMIT 50;

-- ============================================================
-- Alternative: If orders don't have ASIN stored,
-- you may need to re-sync from Amazon or manually set FSN
-- ============================================================

COMMENT ON COLUMN amazon_orders.asin IS 'Amazon ASIN - used to lookup FSN via amazon_asin_mapping';
COMMENT ON COLUMN amazon_orders.fsn IS 'Product FSN - looked up from amazon_asin_mapping using ASIN';
