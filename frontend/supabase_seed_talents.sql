-- Seed Demo Talent Data for Nego
-- Run this AFTER creating a talent account via the app, OR use service role to insert directly

-- First, let's create some demo talent profiles
-- Note: In production, talents would register and be verified

-- Insert demo talents directly (using service role)
-- These are placeholder UUIDs - in real use, these would be actual auth user IDs

DO $$
DECLARE
    talent1_id UUID := gen_random_uuid();
    talent2_id UUID := gen_random_uuid();
    talent3_id UUID := gen_random_uuid();
    talent4_id UUID := gen_random_uuid();
    talent5_id UUID := gen_random_uuid();
    talent6_id UUID := gen_random_uuid();
    
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
    -- Talent 1: Adaeze
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent1_id, dinner_id, 120000, true),
    (talent1_id, event_id, 200000, true),
    (talent1_id, travel_id, 500000, true),
    (talent1_id, private_id, 300000, true);

    -- Talent 2: Chidinma
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent2_id, dinner_id, 180000, true),
    (talent2_id, event_id, 350000, true),
    (talent2_id, travel_id, 800000, true),
    (talent2_id, photo_id, 150000, true);

    -- Talent 3: Folake
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent3_id, dinner_id, 150000, true),
    (talent3_id, event_id, 250000, true),
    (talent3_id, private_id, 350000, true);

    -- Talent 4: Grace
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent4_id, dinner_id, 100000, true),
    (talent4_id, event_id, 180000, true),
    (talent4_id, photo_id, 120000, true);

    -- Talent 5: Halima
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent5_id, dinner_id, 130000, true),
    (talent5_id, travel_id, 450000, true),
    (talent5_id, private_id, 280000, true);

    -- Talent 6: Ify
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active) VALUES
    (talent6_id, dinner_id, 160000, true),
    (talent6_id, event_id, 300000, true),
    (talent6_id, travel_id, 600000, true),
    (talent6_id, photo_id, 140000, true);

    -- Insert some media for talents
    INSERT INTO media (talent_id, url, type, is_premium, unlock_price) VALUES
    (talent1_id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', 'image', false, 0),
    (talent1_id, 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&q=80', 'image', false, 0),
    (talent1_id, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', 'image', true, 50),
    
    (talent2_id, 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=600&q=80', 'image', false, 0),
    (talent2_id, 'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80', 'image', false, 0),
    (talent2_id, 'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&q=80', 'image', true, 75),

    (talent3_id, 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&q=80', 'image', false, 0),
    (talent3_id, 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&q=80', 'image', true, 50);

END $$;
