-- SQL Script to create an admin user in Nego
-- Run this in Supabase SQL Editor after a user has registered

-- Option 1: Upgrade an existing user to admin by email
-- Replace 'admin@example.com' with the actual email
UPDATE profiles
SET role = 'admin'
WHERE id = (
    SELECT id FROM auth.users WHERE email = 'admin@example.com'
);

-- Option 2: Upgrade an existing user to admin by user ID
-- Replace 'user-uuid-here' with the actual user ID
-- UPDATE profiles SET role = 'admin' WHERE id = 'user-uuid-here';

-- Verify the admin was created
SELECT id, role, display_name, full_name 
FROM profiles 
WHERE role = 'admin';
