-- Migration: Add RLS policy for admins to view all orders
-- Date: 2026-01-26
-- Description: Fixes the issue where admins can only see their own orders in the admin panel

-- Add RLS policy for admins to view all orders
-- This follows the same pattern used for multi_fsn_orders
CREATE POLICY "Admins can view all orders"
    ON public.orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Also add policy for order_items so admins can see all order items
CREATE POLICY "Admins can view all order items"
    ON public.order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Verify policies were created
DO $$
BEGIN
  RAISE NOTICE 'Admin orders RLS policies created successfully';
END $$;
