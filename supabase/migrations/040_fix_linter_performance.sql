-- Migration: Fix Supabase Linter Performance Warnings
-- Date: 2026-02-03
-- Issues Fixed:
--   1. Auth RLS InitPlan: welcome_offer_templates policy re-evaluates auth.uid() per row
--   2. Multiple Permissive Policies: orders, order_items, welcome_offer_templates
--   3. Duplicate Indexes: amazon_activation_license_keys, amazon_asin_mapping, warranty_registrations

-- ============================================================
-- 1. FIX WELCOME_OFFER_TEMPLATES POLICIES
-- ============================================================
-- Problem: "Admins can manage offer templates" (FOR ALL) and "Public can read active offer templates" 
-- (FOR SELECT) are both PERMISSIVE and overlap on SELECT operations.
-- Solution: Split admin policy into write-only, create single SELECT policy for all access.

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can manage offer templates" ON welcome_offer_templates;
DROP POLICY IF EXISTS "Public can read active offer templates" ON welcome_offer_templates;

-- 1a. Admin write operations only (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can write offer templates"
    ON welcome_offer_templates
    FOR INSERT
    WITH CHECK (
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can update offer templates"
    ON welcome_offer_templates
    FOR UPDATE
    USING (
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

CREATE POLICY "Admins can delete offer templates"
    ON welcome_offer_templates
    FOR DELETE
    USING (
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- 1b. Single consolidated SELECT policy for ALL access (admin sees all, public sees active only)
CREATE POLICY "Select offer templates"
    ON welcome_offer_templates
    FOR SELECT
    USING (
        -- Admins can see all templates
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
        -- OR anyone can see active templates
        OR is_active = true
    );

-- ============================================================
-- 2. FIX ORDERS TABLE MULTIPLE PERMISSIVE POLICIES
-- ============================================================
-- Consolidate "Users can view own orders" and "Admins can view all orders" into one

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;

CREATE POLICY "Users and admins can view orders" ON public.orders FOR SELECT
    USING (
        user_id = (select auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- ============================================================
-- 3. FIX ORDER_ITEMS TABLE MULTIPLE PERMISSIVE POLICIES
-- ============================================================
-- Consolidate "Users can view own order items" and "Admins can view all order items" into one

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
DROP POLICY IF EXISTS "Admins can view all order items" ON public.order_items;

CREATE POLICY "Users and admins can view order items" ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = (select auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (select auth.uid())
            AND profiles.role IN ('admin', 'super_admin')
        )
    );

-- ============================================================
-- 4. DROP DUPLICATE INDEXES
-- ============================================================

-- 3a. amazon_activation_license_keys: keep idx_amazon_license_*, drop idx_keys_*
DROP INDEX IF EXISTS idx_keys_fsn;
DROP INDEX IF EXISTS idx_keys_order;

-- 3b. amazon_asin_mapping: keep idx_amazon_asin_mapping_*, drop idx_asin_mapping_*
DROP INDEX IF EXISTS idx_asin_mapping_asin;
DROP INDEX IF EXISTS idx_asin_mapping_fsn;

-- 3c. warranty_registrations: keep idx_warranty_registrations_*, drop idx_warranty_*
DROP INDEX IF EXISTS idx_warranty_order_id;
DROP INDEX IF EXISTS idx_warranty_status;

-- ============================================================
-- 5. ENABLE RLS ON FBA TABLES (currently UNRESTRICTED)
-- ============================================================

-- Enable RLS
ALTER TABLE fba_early_appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE fba_state_delays ENABLE ROW LEVEL SECURITY;

-- fba_early_appeals: Admin-only access for all operations
CREATE POLICY "Admins can manage early appeals" ON fba_early_appeals
    FOR ALL
    USING (
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- fba_state_delays: Admin-only for writes, but allow reads for service role (activation API)
-- The activation API uses admin client which bypasses RLS anyway
CREATE POLICY "Admins can manage state delays" ON fba_state_delays
    FOR ALL
    USING (
        (select auth.uid()) IN (
            SELECT id FROM profiles 
            WHERE role IN ('admin', 'super_admin')
        )
    );

-- ============================================================
-- VERIFICATION
-- ============================================================
DO $$
BEGIN
    RAISE NOTICE 'Migration 040_fix_linter_performance completed successfully';
    RAISE NOTICE 'Fixed: Auth RLS InitPlan, Multiple Permissive Policies, Duplicate Indexes';
    RAISE NOTICE 'Please re-run the Supabase Linter to verify all warnings are resolved';
END $$;
