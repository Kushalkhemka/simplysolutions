-- Fix for Multiple Permissive Policies Warning
-- Run this in Supabase SQL Editor to fix the duplicate policies

-- Drop the redundant service role policies (FOR ALL already covers SELECT)
DROP POLICY IF EXISTS "Service role full access on amazon_secret_codes" ON amazon_secret_codes;
DROP POLICY IF EXISTS "Service role full access on amazon_activation_license_keys" ON amazon_activation_license_keys;

-- Keep only the public read policies for SELECT
-- The API uses service_role key which bypasses RLS anyway, so these policies are sufficient

-- Verify the fix
SELECT tablename, policyname, cmd FROM pg_policies 
WHERE tablename IN ('amazon_secret_codes', 'amazon_activation_license_keys');
