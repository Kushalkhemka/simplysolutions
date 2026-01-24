-- Fix Supabase Linter Warnings
-- 1. Fix RLS policy performance for getcid_tokens (wrap auth.role() in SELECT)
-- 2. Fix function search_path for security
-- 3. Fix overly permissive RLS policies

-- ============================================
-- 1. FIX GETCID_TOKENS RLS POLICY
-- ============================================
DROP POLICY IF EXISTS "Service role can manage getcid_tokens" ON getcid_tokens;

CREATE POLICY "Service role can manage getcid_tokens"
    ON getcid_tokens
    FOR ALL
    USING ((select auth.role()) = 'service_role')
    WITH CHECK ((select auth.role()) = 'service_role');

-- ============================================
-- 2. FIX FUNCTION SEARCH PATHS
-- ============================================

-- Recreate get_available_getcid_token with search_path set
CREATE OR REPLACE FUNCTION get_available_getcid_token()
RETURNS TABLE(token TEXT, remaining_uses INTEGER) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    SELECT t.token, (t.total_available - t.count_used) AS remaining_uses
    FROM public.getcid_tokens t
    WHERE t.is_active = TRUE
      AND t.count_used < t.total_available
    ORDER BY t.priority DESC, t.count_used ASC
    LIMIT 1;
END;
$$;

-- Recreate increment_getcid_token_usage with search_path set
CREATE OR REPLACE FUNCTION increment_getcid_token_usage(p_token TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE public.getcid_tokens
    SET count_used = count_used + 1,
        last_used_at = NOW(),
        updated_at = NOW()
    WHERE token = p_token
      AND count_used < total_available;
    
    v_updated := FOUND;
    RETURN v_updated;
END;
$$;

-- ============================================
-- 3. NOTE ON OTHER RLS POLICIES
-- ============================================

-- IMPORTANT: Do NOT change amazon_activation_license_keys policy!
-- The admin pages use the browser client (anon key) to query this table.
-- Changing it to service_role only would break all admin pages.
-- The current "USING (true)" is intentional for admin dashboard access.

-- The following INSERT policies with `WITH CHECK (true)` are INTENTIONAL
-- because they allow public form submissions from unauthenticated users:
-- - license_replacement_requests: Public form for key replacement requests
-- - office365_customizations: Public form for Office 365 customization preferences
-- - office365_requests: Public form for Office 365 enterprise requests
-- - product_requests: Public form for product requests (Canva, AutoCAD, etc.)
-- - warranty_registrations: Public form for warranty registration
-- - product_comparisons: Public form for product comparisons
-- - quotes: Public form for quote requests

-- These policies are correct for the intended use case (public forms)
