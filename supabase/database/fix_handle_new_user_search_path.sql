-- Fix handle_new_user() function to set a fixed search_path
-- This resolves the security issue: "Function public.handle_new_user has a role mutable search_path"
-- Run this script in Supabase SQL Editor

-- Drop and recreate the trigger function with fixed search_path
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  -- Determine user role from metadata, default to 'client'
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'client'
  );

  -- Create profile
  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    username,
    avatar_url,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_role_val,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create wallet with balance set to 0
  INSERT INTO public.wallets (
    user_id,
    balance,
    escrow_balance
  ) VALUES (
    NEW.id,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail user creation
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Verify the trigger is attached to auth.users
-- If the trigger doesn't exist, create it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Successfully updated handle_new_user() function with fixed search_path. Security issue resolved.';
END $$;
