-- Migration: Fix products_data RLS policies for better performance
-- Fixes:
-- 1. auth_rls_initplan: Wrap auth.role() with (select ...) to avoid per-row re-evaluation
-- 2. multiple_permissive_policies: Remove overlapping SELECT policies

-- Drop existing policies
DROP POLICY IF EXISTS "Allow public read access to products_data" ON products_data;
DROP POLICY IF EXISTS "Only service role can modify products_data" ON products_data;

-- Recreate read access policy (unchanged, allows all SELECT)
CREATE POLICY "Allow public read access to products_data"
ON products_data FOR SELECT
USING (true);

-- Service role can INSERT
CREATE POLICY "Service role can insert products_data"
ON products_data FOR INSERT
WITH CHECK ((select auth.role()) = 'service_role');

-- Service role can UPDATE
CREATE POLICY "Service role can update products_data"
ON products_data FOR UPDATE
USING ((select auth.role()) = 'service_role')
WITH CHECK ((select auth.role()) = 'service_role');

-- Service role can DELETE
CREATE POLICY "Service role can delete products_data"
ON products_data FOR DELETE
USING ((select auth.role()) = 'service_role');
