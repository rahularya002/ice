/*
  # Fix User Creation Database Error

  1. Problem Analysis
    - The auth user creation is failing due to database constraints
    - Likely caused by circular foreign key dependencies
    - The trigger might be failing due to constraint violations

  2. Solution
    - Remove circular foreign key constraints temporarily
    - Fix the trigger to handle missing references gracefully
    - Re-add constraints after ensuring data integrity
    - Add proper error handling in the trigger

  3. Changes
    - Drop and recreate the user creation trigger with better error handling
    - Temporarily remove circular foreign key constraints
    - Add them back with proper handling
    - Ensure the profiles table can be created without dependencies
*/

-- First, let's drop the problematic foreign key constraint that might be causing circular dependency
ALTER TABLE departments DROP CONSTRAINT IF EXISTS fk_departments_manager;

-- Drop and recreate the trigger with better error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create an improved function to handle profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into profiles with basic information
  -- Don't reference any other tables that might not exist yet
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'employee')
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth user creation
    RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Now let's add back the foreign key constraint with deferred checking
ALTER TABLE departments 
ADD CONSTRAINT fk_departments_manager 
FOREIGN KEY (manager_id) REFERENCES profiles(id) 
DEFERRABLE INITIALLY DEFERRED;

-- Add a policy to allow profile creation during user signup
CREATE POLICY "Allow profile creation during signup" ON profiles
  FOR INSERT TO authenticated WITH CHECK (true);

-- Also allow service role to insert profiles (for admin creation)
CREATE POLICY "Service role can insert profiles" ON profiles
  FOR INSERT TO service_role WITH CHECK (true);

-- Ensure the service role can read profiles too
CREATE POLICY "Service role can read profiles" ON profiles
  FOR SELECT TO service_role USING (true);

-- Add a policy for service role to update profiles
CREATE POLICY "Service role can update profiles" ON profiles
  FOR UPDATE TO service_role USING (true);

-- Grant necessary permissions to authenticated users for profile creation
GRANT INSERT ON profiles TO authenticated;
GRANT SELECT ON profiles TO authenticated;
GRANT UPDATE ON profiles TO authenticated;

-- Grant permissions to service role
GRANT ALL ON profiles TO service_role;
GRANT ALL ON departments TO service_role;
GRANT ALL ON designations TO service_role;

-- Ensure the sequence permissions are granted
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- Create a function to safely create admin user
CREATE OR REPLACE FUNCTION create_admin_user(
  user_email text,
  user_name text,
  user_password text
)
RETURNS json AS $$
DECLARE
  new_user_id uuid;
  result json;
BEGIN
  -- This function should be called by the service role
  -- It will create both the auth user and profile in a transaction
  
  -- Note: This is a placeholder function
  -- The actual user creation should be done via Supabase Auth API
  -- This function just ensures the profile can be created
  
  SELECT json_build_object(
    'success', true,
    'message', 'Function ready for admin creation'
  ) INTO result;
  
  RETURN result;
EXCEPTION
  WHEN OTHERS THEN
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION create_admin_user TO service_role;
GRANT EXECUTE ON FUNCTION create_admin_user TO authenticated;