-- Migration to add slug support to profiles for better performance
-- This avoids in-memory slugification for profile lookups

-- 1. Create a slugify function
CREATE OR REPLACE FUNCTION slugify(text)
RETURNS text AS $$
BEGIN
  RETURN LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM($1), '[^a-zA-Z0-9]+', '-', 'gi'), '^-|-$', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 2. Add slug column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'slug') THEN
        ALTER TABLE profiles ADD COLUMN slug TEXT;
    END IF;
END $$;

-- 3. Populate existing slugs
-- If username exists, use it as fallback for slug if display_name is missing
UPDATE profiles
SET slug = COALESCE(username, slugify(display_name), id::text)
WHERE slug IS NULL;

-- 4. Add index for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_slug ON profiles(slug);

-- 5. Create trigger to keep slug updated
CREATE OR REPLACE FUNCTION update_profile_slug_trigger()
RETURNS TRIGGER AS $$
BEGIN
  -- Priority for slug: username (if manually set) > display_name slug
  -- If display_name is being updated or is being set for the first time
  IF (TG_OP = 'INSERT') OR (NEW.display_name IS DISTINCT FROM OLD.display_name) OR (NEW.username IS DISTINCT FROM OLD.username) THEN
    IF NEW.username IS NOT NULL THEN
      NEW.slug := NEW.username;
    ELSIF NEW.display_name IS NOT NULL THEN
      NEW.slug := slugify(NEW.display_name);
    ELSE
      NEW.slug := NEW.id::text;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_profile_slug ON profiles;
CREATE TRIGGER trg_update_profile_slug
BEFORE INSERT OR UPDATE ON profiles
FOR EACH ROW EXECUTE FUNCTION update_profile_slug_trigger();
