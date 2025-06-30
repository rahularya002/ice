-- Migration: Relaxed RLS policy for internal use
-- Date: 2024-07-01

-- Remove any restrictive insert policies first
DROP POLICY IF EXISTS "Admins can insert profiles" ON profiles;
DROP POLICY IF EXISTS "Service role can insert profiles" ON profiles;

-- Allow all authenticated users to insert into profiles
CREATE POLICY "Anyone can insert profiles" ON profiles
  FOR INSERT TO authenticated
  WITH CHECK (true); 