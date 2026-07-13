-- Migration: Add gender to profiles
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'gender') THEN
        ALTER TABLE profiles ADD COLUMN gender TEXT;
        -- Add check constraint for common values
        ALTER TABLE profiles ADD CONSTRAINT profiles_gender_check CHECK (gender IN ('male', 'female', 'other'));
    END IF;
END $$;
