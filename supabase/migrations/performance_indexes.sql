-- Phase 3: Performance Optimization Indexes
-- Optimization for Browse Page filtering

-- 1. Composite profile indexing for role + common filters
-- This significantly speeds up the .eq('role', 'talent').eq('location', L).eq('gender', G) pattern
CREATE INDEX IF NOT EXISTS idx_profiles_browse_filters 
ON profiles (role, location, gender, status);

-- 2. Search indexing for text searches (display_name, username, bio)
-- Best used with ilike searches
CREATE INDEX IF NOT EXISTS idx_profiles_search_text
ON profiles USING gin (
  to_tsvector('english', 
    coalesce(display_name, '') || ' ' || 
    coalesce(username, '') || ' ' || 
    coalesce(bio, '')
  )
);

-- 3. Optimization for JOINs and active service checks
CREATE INDEX IF NOT EXISTS idx_talent_menus_lookup
ON talent_menus (talent_id, service_type_id) 
WHERE is_active = true;

-- 4. Pricing sort optimization
CREATE INDEX IF NOT EXISTS idx_profiles_starting_price
ON profiles (starting_price ASC NULLS LAST)
WHERE role = 'talent';

COMMENT ON INDEX idx_profiles_browse_filters IS 'Speeds up the Browse talent page by indexing core filter columns.';
