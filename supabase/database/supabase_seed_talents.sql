-- Seed Demo Talent Data for Nego
-- This script temporarily removes the FK constraint to insert demo data

-- Step 1: Drop the foreign key constraint temporarily
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Step 2: Insert demo talents
DO $$
DECLARE
    talent1_id UUID := 'a1111111-1111-1111-1111-111111111111';
    talent2_id UUID := 'a2222222-2222-2222-2222-222222222222';
    talent3_id UUID := 'a3333333-3333-3333-3333-333333333333';
    talent4_id UUID := 'a4444444-4444-4444-4444-444444444444';
    talent5_id UUID := 'a5555555-5555-5555-5555-555555555555';
    talent6_id UUID := 'a6666666-6666-6666-6666-666666666666';
    
    dinner_id UUID;
    event_id UUID;
    travel_id UUID;
    private_id UUID;
    photo_id UUID;
BEGIN
    -- Get service type IDs
    SELECT id INTO dinner_id FROM service_types WHERE name = 'Dinner Date';
    SELECT id INTO event_id FROM service_types WHERE name = 'Event Companion';
    SELECT id INTO travel_id FROM service_types WHERE name = 'Travel Companion';
    SELECT id INTO private_id FROM service_types WHERE name = 'Private Meeting';
    SELECT id INTO photo_id FROM service_types WHERE name = 'Photo Session';

    -- Delete existing demo data (if re-running)
    DELETE FROM media WHERE talent_id IN (talent1_id, talent2_id, talent3_id, talent4_id, talent5_id, talent6_id);
    DELETE FROM talent_menus WHERE talent_id IN (talent1_id, talent2_id, talent3_id, talent4_id, talent5_id, talent6_id);
    DELETE FROM wallets WHERE user_id IN (talent1_id, talent2_id, talent3_id, talent4_id, talent5_id, talent6_id);
    DELETE FROM profiles WHERE id IN (talent1_id, talent2_id, talent3_id, talent4_id, talent5_id, talent6_id);

    -- Insert talent profiles
    INSERT INTO profiles (id, role, display_name, location, bio, avatar_url, is_verified, status, starting_price) VALUES
    (talent1_id, 'talent', 'Adaeze', 'Lagos', 'Sophisticated and charming companion for any high-profile occasion. Fluent in English and French.', 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', true, 'online', 120000),
    (talent2_id, 'talent', 'Chidinma', 'Abuja', 'Elegant presence for corporate events and exclusive gatherings. Expert in etiquette and conversation.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', true, 'online', 180000),
    (talent3_id, 'talent', 'Folake', 'Port Harcourt', 'Refined and flirtatious, perfect for dinner dates and social events. Passionate about art and culture.', 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', true, 'offline', 150000),
    (talent4_id, 'talent', 'Grace', 'Lagos', 'Charismatic and engaging companion for social gatherings. Former model with international experience.', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', true, 'online', 100000),
    (talent5_id, 'talent', 'Halima', 'Kano', 'Graceful and discreet for exclusive encounters. Well-traveled and multilingual.', 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', true, 'booked', 130000),
    (talent6_id, 'talent', 'Ify', 'Enugu', 'Sophisticated presence for corporate and social events. MBA graduate with business acumen.', 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', true, 'online', 160000);

    -- Create wallets for talents
    INSERT INTO wallets (user_id, balance) VALUES
    (talent1_id, 0),
    (talent2_id, 0),
    (talent3_id, 0),
    (talent4_id, 0),
    (talent5_id, 0),
    (talent6_id, 0);

    -- Insert talent menus (services and prices)
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent1_id, dinner_id, 120000, true),
    (talent1_id, event_id, 200000, true),
    (talent1_id, travel_id, 500000, true),
    (talent1_id, private_id, 300000, true),
    (talent2_id, dinner_id, 180000, true),
    (talent2_id, event_id, 350000, true),
    (talent2_id, travel_id, 800000, true),
    (talent2_id, photo_id, 150000, true),
    (talent3_id, dinner_id, 150000, true),
    (talent3_id, event_id, 250000, true),
    (talent3_id, private_id, 350000, true),
    (talent4_id, dinner_id, 100000, true),
    (talent4_id, event_id, 180000, true),
    (talent4_id, photo_id, 120000, true),
    (talent5_id, dinner_id, 130000, true),
    (talent5_id, travel_id, 450000, true),
    (talent5_id, private_id, 280000, true),
    (talent6_id, dinner_id, 160000, true),
    (talent6_id, event_id, 300000, true),
    (talent6_id, travel_id, 600000, true),
    (talent6_id, photo_id, 140000, true);

    -- Insert media for talents
    INSERT INTO media (talent_id, url, type, is_premium, unlock_price) VALUES
    (talent1_id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', 'image', false, 0),
    (talent1_id, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', 'image', false, 0),
    (talent1_id, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', 'image', true, 50),
    (talent2_id, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', 'image', false, 0),
    (talent2_id, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', 'image', false, 0),
    (talent2_id, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', 'image', true, 75),
    (talent3_id, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', 'image', false, 0),
    (talent3_id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', 'image', true, 50),
    (talent4_id, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', 'image', false, 0),
    (talent4_id, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', 'image', false, 0),
    (talent5_id, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', 'image', false, 0),
    (talent5_id, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', 'image', true, 60),
    (talent6_id, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', 'image', false, 0),
    (talent6_id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', 'image', false, 0);

    RAISE NOTICE 'Demo data inserted successfully!';
END $$;

-- Step 3: Re-add the foreign key constraint (but NOT VALID to skip checking existing rows)
ALTER TABLE profiles 
ADD CONSTRAINT profiles_id_fkey 
FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE 
NOT VALID;

-- Verify the data was inserted
SELECT 'Profiles' as table_name, count(*) as count FROM profiles WHERE role = 'talent'
UNION ALL
SELECT 'Talent Menus', count(*) FROM talent_menus
UNION ALL
SELECT 'Media', count(*) FROM media;
