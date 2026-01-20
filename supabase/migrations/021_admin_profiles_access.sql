-- Fix RLS policy performance issues for profiles table
-- 1. Use (select auth.function()) instead of auth.function() for better performance
-- 2. Consolidate multiple permissive policies

-- Drop the problematic policies we just created
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create optimized consolidated SELECT policy
-- This combines: own profile access + admin access
CREATE POLICY "profiles_select_policy" ON public.profiles
FOR SELECT USING (
    (select auth.uid()) = id  -- Users can view their own profile
    OR 
    EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id = (select auth.uid()) AND p.role IN ('admin', 'super_admin')
    )
);

-- Create optimized UPDATE policy
-- Users can only update their own profile
CREATE POLICY "profiles_update_policy" ON public.profiles
FOR UPDATE USING (
    (select auth.uid()) = id
);

-- Create INSERT policy for new user registration
CREATE POLICY "profiles_insert_policy" ON public.profiles
FOR INSERT WITH CHECK (
    (select auth.uid()) = id
);
