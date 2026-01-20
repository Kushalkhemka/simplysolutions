-- Fix RLS policy for profiles table
-- The issue is that the current policy prevents authenticated users from reading their own profile
-- because it requires a subquery to profiles table which creates a chicken-and-egg problem

-- Drop existing problematic policies
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;

-- Create a simple, working SELECT policy
-- Anyone authenticated can read their own profile
CREATE POLICY "profiles_select_own" ON public.profiles
FOR SELECT USING (
    auth.uid() = id
);

-- Separate policy for admin access (avoids recursive check)
-- Uses a service role approach instead of checking profiles table
CREATE POLICY "profiles_select_admin" ON public.profiles
FOR SELECT USING (
    auth.jwt() ->> 'role' = 'service_role'
);

-- UPDATE policy - users can only update their own profile
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (
    auth.uid() = id
);

-- INSERT policy - for new user registration (triggered by auth.users insert)
-- The trigger uses SECURITY DEFINER so it can insert regardless of RLS
CREATE POLICY "profiles_insert_own" ON public.profiles
FOR INSERT WITH CHECK (
    auth.uid() = id
);

-- Grant the authenticated role ability to select from profiles
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT INSERT ON public.profiles TO authenticated;
