-- Fix for Supabase handle_new_user() trigger
-- Run this in Supabase SQL Editor to fix the user registration issue

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Recreate the function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role_value user_role;
BEGIN
    -- Safely get the role from metadata, default to 'client'
    BEGIN
        IF NEW.raw_user_meta_data->>'role' IS NOT NULL AND 
           NEW.raw_user_meta_data->>'role' IN ('client', 'talent', 'admin') THEN
            user_role_value := (NEW.raw_user_meta_data->>'role')::user_role;
        ELSE
            user_role_value := 'client'::user_role;
        END IF;
    EXCEPTION WHEN OTHERS THEN
        user_role_value := 'client'::user_role;
    END;

    -- Create profile
    INSERT INTO profiles (id, role, full_name, avatar_url)
    VALUES (
        NEW.id,
        user_role_value,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create wallet
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.id, 100);  -- Give new users 100 coins to start
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Log the error but don't fail the user creation
    RAISE WARNING 'Error in handle_new_user: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Verify the trigger exists
SELECT tgname, tgtype, tgenabled 
FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';
