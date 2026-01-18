-- Fix sold_count for products based on delivered orders
-- Run this once to backfill historical data

-- Reset all sold_counts to 0 first
UPDATE products SET sold_count = 0;

-- Calculate and set sold_count based on delivered order items
UPDATE products p
SET sold_count = COALESCE(
    (
        SELECT SUM(oi.quantity)
        FROM order_items oi
        JOIN orders o ON o.id = oi.order_id
        WHERE oi.product_id = p.id
        AND o.status = 'delivered'
    ),
    0
);

-- Verify the update
SELECT id, name, sold_count 
FROM products 
WHERE sold_count > 0
ORDER BY sold_count DESC;
