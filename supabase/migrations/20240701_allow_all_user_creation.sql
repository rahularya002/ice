-- Migration: Allow all user creation for internal use
-- Date: 2024-07-01

-- Remove any restrictive insert policies first
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Anyone can insert profiles" ON profiles;

-- Allow all authenticated users to insert into profiles
CREATE POLICY "All authenticated can insert profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Note: Direct insertion into auth.users is not possible via SQL policy; must use Supabase Auth API. 