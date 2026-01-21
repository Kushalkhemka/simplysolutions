-- Complete cleanup of profiles RLS policies
-- Drop ALL existing policies to eliminate duplicates

-- Drop all possible policy names that might exist
DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Service role full access on profiles" ON public.profiles;

-- Now create clean, optimized policies (only one per action)

-- SELECT: Users can read their own profile
CREATE POLICY "profiles_select" ON public.profiles
FOR SELECT USING (
    (select auth.uid()) = id
);

-- UPDATE: Users can update their own profile
CREATE POLICY "profiles_update" ON public.profiles
FOR UPDATE USING (
    (select auth.uid()) = id
);

-- INSERT: For new user registration via trigger
CREATE POLICY "profiles_insert" ON public.profiles
FOR INSERT WITH CHECK (
    (select auth.uid()) = id
);

-- Verify policies are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename = 'profiles';
