-- Fix handle_new_user() trigger and backfill missing profiles
-- This script will:
-- 1. Check if the trigger exists
-- 2. Recreate the trigger function with proper error handling
-- 3. Recreate the trigger
-- 4. Backfill profiles for existing users who don't have profiles
-- Run this script in Supabase SQL Editor

-- ============================================================================
-- PART 1: Recreate handle_new_user() function with fixed search_path
-- ============================================================================
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

-- ============================================================================
-- PART 2: Recreate the trigger
-- ============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- PART 3: Backfill profiles for existing users who don't have profiles
-- ============================================================================
DO $$
DECLARE
    auth_user RECORD;
    user_role_val user_role;
    profile_count INTEGER;
    wallet_count INTEGER;
BEGIN
    RAISE NOTICE 'Starting profile backfill for existing users...';

    -- Loop through all auth users
    FOR auth_user IN
        SELECT
            id,
            email,
            raw_user_meta_data,
            created_at
        FROM auth.users
        WHERE id NOT IN (SELECT id FROM public.profiles)
    LOOP
        -- Determine role from metadata
        user_role_val := COALESCE(
            (auth_user.raw_user_meta_data->>'role')::user_role,
            'client'
        );

        -- Create profile
        BEGIN
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
                auth_user.id,
                user_role_val,
                COALESCE(
                    auth_user.raw_user_meta_data->>'full_name',
                    auth_user.raw_user_meta_data->>'name',
                    'User'
                ),
                auth_user.raw_user_meta_data->>'username',
                COALESCE(
                    auth_user.raw_user_meta_data->>'avatar_url',
                    auth_user.raw_user_meta_data->>'picture'
                ),
                auth_user.email,
                auth_user.created_at,
                NOW()
            );

            profile_count := profile_count + 1;
            RAISE NOTICE 'Created profile for user: % (role: %)', auth_user.email, user_role_val;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create profile for user %: %', auth_user.email, SQLERRM;
        END;

        -- Create wallet if it doesn't exist
        BEGIN
            INSERT INTO public.wallets (
                user_id,
                balance,
                escrow_balance
            ) VALUES (
                auth_user.id,
                0,
                0
            )
            ON CONFLICT (user_id) DO NOTHING;

            IF NOT FOUND THEN
                wallet_count := wallet_count + 1;
                RAISE NOTICE 'Created wallet for user: %', auth_user.email;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to create wallet for user %: %', auth_user.email, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE 'Backfill complete. Created % profiles and % wallets.', profile_count, wallet_count;
END $$;

-- ============================================================================
-- PART 4: Verification
-- ============================================================================
-- Check trigger exists
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'on_auth_user_created'
        AND tgrelid = 'auth.users'::regclass
    ) INTO trigger_exists;

    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname = 'handle_new_user'
    ) INTO function_exists;

    IF trigger_exists AND function_exists THEN
        RAISE NOTICE '✓ Trigger and function are properly configured';
    ELSE
        RAISE WARNING '✗ Trigger or function is missing!';
        RAISE WARNING 'Trigger exists: %, Function exists: %', trigger_exists, function_exists;
    END IF;
END $$;

-- Count users without profiles
DO $$
DECLARE
    missing_profiles_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_profiles_count
    FROM auth.users
    WHERE id NOT IN (SELECT id FROM public.profiles);

    IF missing_profiles_count > 0 THEN
        RAISE WARNING 'There are still % users without profiles. Check the backfill logs above.', missing_profiles_count;
    ELSE
        RAISE NOTICE '✓ All users have profiles';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'handle_new_user() trigger fix complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Recreated handle_new_user() function with fixed search_path';
    RAISE NOTICE '2. Recreated on_auth_user_created trigger';
    RAISE NOTICE '3. Backfilled profiles for existing users';
    RAISE NOTICE '';
    RAISE NOTICE 'New users will now automatically get profiles and wallets.';
    RAISE NOTICE 'Existing users without profiles have been backfilled.';
END $$;
