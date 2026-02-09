-- Add shipment_status column to amazon_orders for admin bypass of FBA delivery lock
-- Values: PENDING (default), SHIPPED, DELIVERED
-- When DELIVERED, order bypasses time-based delivery lock

ALTER TABLE amazon_orders
ADD COLUMN IF NOT EXISTS shipment_status TEXT DEFAULT 'PENDING';

-- Add check constraint for valid values
ALTER TABLE amazon_orders
ADD CONSTRAINT amazon_orders_shipment_status_check
CHECK (shipment_status IN ('PENDING', 'SHIPPED', 'DELIVERED'));

-- Create index for filtering by shipment status
CREATE INDEX IF NOT EXISTS idx_amazon_orders_shipment_status 
ON amazon_orders(shipment_status);

-- Add comment for documentation
COMMENT ON COLUMN amazon_orders.shipment_status IS 'Admin-controlled shipment status: PENDING, SHIPPED, DELIVERED. DELIVERED bypasses FBA delivery lock.';
