-- Backfill license_key_id in amazon_orders from amazon_activation_license_keys
-- This links each order to its first assigned license key for backward compatibility

-- First, let's see how many orders need backfilling
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN license_key_id IS NULL THEN 1 END) as null_license_key_id,
    COUNT(CASE WHEN license_key_id IS NOT NULL THEN 1 END) as has_license_key_id
FROM amazon_orders;

-- See how many orders have keys assigned in the keys table
SELECT COUNT(DISTINCT order_id) as orders_with_keys
FROM amazon_activation_license_keys
WHERE order_id IS NOT NULL;

-- Preview what will be updated (first 20)
SELECT 
    ao.order_id,
    ao.license_key_id as current_license_key_id,
    alk.id as new_license_key_id,
    alk.license_key,
    alk.fsn
FROM amazon_orders ao
JOIN amazon_activation_license_keys alk ON ao.order_id = alk.order_id
WHERE ao.license_key_id IS NULL
LIMIT 20;

-- ============================================
-- RUN THIS TO BACKFILL (removes duplicates by using DISTINCT ON)
-- ============================================
UPDATE amazon_orders ao
SET license_key_id = subq.key_id
FROM (
    SELECT DISTINCT ON (order_id) 
        order_id, 
        id as key_id
    FROM amazon_activation_license_keys
    WHERE order_id IS NOT NULL
    ORDER BY order_id, redeemed_at ASC NULLS LAST
) subq
WHERE ao.order_id = subq.order_id
AND ao.license_key_id IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_orders,
    COUNT(CASE WHEN license_key_id IS NULL THEN 1 END) as still_null,
    COUNT(CASE WHEN license_key_id IS NOT NULL THEN 1 END) as now_populated
FROM amazon_orders;
