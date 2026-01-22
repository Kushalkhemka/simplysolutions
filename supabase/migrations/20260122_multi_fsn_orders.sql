-- Create table to log multi-product orders for manual admin handling
CREATE TABLE IF NOT EXISTS multi_fsn_orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id TEXT NOT NULL,
    order_date TIMESTAMPTZ,
    buyer_email TEXT,
    contact_email TEXT,
    items JSONB NOT NULL, -- Array of {asin, sku, fsn, title, quantity, price}
    item_count INTEGER NOT NULL,
    total_amount DECIMAL(10,2),
    currency TEXT DEFAULT 'INR',
    fulfillment_type TEXT,
    status TEXT DEFAULT 'PENDING', -- PENDING, PROCESSED
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    processed_by UUID REFERENCES auth.users(id)
);

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_multi_fsn_orders_order_id ON multi_fsn_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_multi_fsn_orders_status ON multi_fsn_orders(status);
CREATE INDEX IF NOT EXISTS idx_multi_fsn_orders_created_at ON multi_fsn_orders(created_at DESC);

-- Add RLS policies
ALTER TABLE multi_fsn_orders ENABLE ROW LEVEL SECURITY;

-- Admin can see all
CREATE POLICY "Admins can view all multi-FSN orders"
    ON multi_fsn_orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Admin can update
CREATE POLICY "Admins can update multi-FSN orders"
    ON multi_fsn_orders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Comment
COMMENT ON TABLE multi_fsn_orders IS 'Logs Amazon orders with multiple products (different FSNs) for manual admin handling';
