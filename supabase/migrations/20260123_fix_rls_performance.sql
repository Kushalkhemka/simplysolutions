-- Migration: Fix RLS policy performance for multi_fsn_orders
-- Date: 2026-01-23
-- Description: Optimizes RLS policies to prevent auth.uid() from being re-evaluated for each row
-- This fixes the "Auth RLS Initialization Plan" warning from Supabase linter

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all multi-FSN orders" ON public.multi_fsn_orders;
DROP POLICY IF EXISTS "Admins can update multi-FSN orders" ON public.multi_fsn_orders;

-- Recreate policies with optimized auth.uid() calls
-- Admin can see all
CREATE POLICY "Admins can view all multi-FSN orders"
    ON public.multi_fsn_orders FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Admin can update
CREATE POLICY "Admins can update multi-FSN orders"
    ON public.multi_fsn_orders FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- Verify policies were updated
DO $$
BEGIN
  RAISE NOTICE 'RLS policies optimized successfully';
END $$;
