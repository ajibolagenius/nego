-- SIMPLE FIX for Supabase handle_new_user() trigger
-- This is the simplest possible version that should definitely work

-- Step 1: Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Step 2: Create simple function (no complex logic)
CREATE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert profile with default 'client' role
    INSERT INTO public.profiles (id, role, full_name)
    VALUES (NEW.id, 'client', COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
    
    -- Insert wallet with 100 starting coins
    INSERT INTO public.wallets (user_id, balance)
    VALUES (NEW.id, 100);
    
    RETURN NEW;
END;
$$;

-- Step 3: Create trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_user();

-- Step 4: Grant permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Step 5: Verify
SELECT 'Trigger created successfully!' as status;
SELECT tgname, tgenabled FROM pg_trigger WHERE tgname = 'on_auth_user_created';
