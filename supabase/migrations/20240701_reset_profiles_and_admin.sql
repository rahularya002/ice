-- Migration: Reset profiles and create admin profile
-- Date: 2024-07-01

-- 1. Delete all existing profiles
DELETE FROM profiles;

-- 2. Insert a new admin profile (replace the placeholders with actual values)
INSERT INTO profiles (id, email, name, role)
VALUES ('REPLACE_WITH_NEW_ADMIN_USER_ID', 'admin@example.com', 'Admin User', 'admin');

-- Instructions:
-- 1. Create a new user in the Supabase dashboard (Auth > Users > Add User).
-- 2. Copy the new user's id and email into the placeholders above before running this migration. 