-- ============================================
-- SUPABASE RESET AND COMPREHENSIVE SEED SCRIPT
-- ============================================
-- This script:
-- 1. Removes all test data from all tables
-- 2. Clears all storage buckets
-- 3. Populates comprehensive new datasets
-- ============================================

-- ============================================
-- PART 1: CLEANUP - Delete all test data
-- ============================================
-- Delete in order to respect foreign key constraints

-- Delete user unlocks (no dependencies)
DELETE FROM user_unlocks;

-- Delete media (referenced by user_unlocks)
DELETE FROM media;

-- Delete reviews (references bookings, profiles)
DELETE FROM reviews;

-- Delete messages (references conversations, profiles)
DELETE FROM messages;

-- Delete conversations (references bookings, profiles)
DELETE FROM conversations;

-- Delete verifications (references bookings, profiles)
DELETE FROM verifications;

-- Delete gifts (references profiles)
DELETE FROM gifts;

-- Delete notifications (references profiles)
DELETE FROM notifications;

-- Delete withdrawal requests (references profiles)
DELETE FROM withdrawal_requests;

-- Delete transactions (references profiles)
DELETE FROM transactions;

-- Delete bookings (references profiles)
DELETE FROM bookings;

-- Delete talent menus (references profiles, service_types)
DELETE FROM talent_menus;

-- Delete wallets (references profiles)
DELETE FROM wallets;

-- Delete push subscriptions (references auth.users)
DELETE FROM push_subscriptions;

-- Delete profiles (references auth.users)
-- Note: This will NOT delete auth.users records
-- You may need to manually clean auth.users via Supabase Dashboard if needed
DELETE FROM profiles;

-- ============================================
-- PART 2: STORAGE CLEANUP
-- ============================================
-- Clear all files from storage buckets
-- Note: Storage cleanup should be done via Supabase Dashboard or API
-- Uncomment and run these if you have proper permissions:

-- DELETE FROM storage.objects WHERE bucket_id = 'verifications';
-- DELETE FROM storage.objects WHERE bucket_id = 'avatars';
-- DELETE FROM storage.objects WHERE bucket_id = 'media';

-- ============================================
-- PART 3: SEED DATA - Populate comprehensive datasets
-- ============================================

DO $$
DECLARE
    -- Service type IDs
    acting_id UUID;
    comedy_id UUID;
    dancing_id UUID;
    hosting_id UUID;
    modeling_id UUID;
    photography_id UUID;
    singing_id UUID;
    videography_id UUID;

    -- Talent IDs
    grace_id UUID;
    chidi_id UUID;
    amara_id UUID;
    tunde_id UUID;
    zara_id UUID;
    ken_id UUID;
    bella_id UUID;
    segun_id UUID;
    nkem_id UUID;
    bayo_id UUID;
    chioma_id UUID;
    femi_id UUID;
    temi_id UUID;
    ade_id UUID;
    wumi_id UUID;

    -- Booking variables
    client_ids UUID[];
    talent_ids UUID[];
    booking_id UUID;
    client_id UUID;
    talent_id UUID;
    menu_items JSONB;
    total_price INT;
    i INT;

    -- Conversation variables
    conv_id UUID;
    booking_id_var UUID;
    j INT;
BEGIN
    -- Get service type IDs
    SELECT id INTO acting_id FROM service_types WHERE name = 'Acting';
    SELECT id INTO comedy_id FROM service_types WHERE name = 'Comedy';
    SELECT id INTO dancing_id FROM service_types WHERE name = 'Dancing';
    SELECT id INTO hosting_id FROM service_types WHERE name = 'Hosting';
    SELECT id INTO modeling_id FROM service_types WHERE name = 'Modeling';
    SELECT id INTO photography_id FROM service_types WHERE name = 'Photography';
    SELECT id INTO singing_id FROM service_types WHERE name = 'Singing';
    SELECT id INTO videography_id FROM service_types WHERE name = 'Videography';

    -- ============================================
    -- Create Client Profiles (10 clients)
    -- ============================================
    INSERT INTO profiles (id, role, username, full_name, display_name, avatar_url, location, bio, is_verified, status, starting_price, push_notifications_enabled, created_at, updated_at)
    VALUES
        (gen_random_uuid(), 'client', 'john_doe', 'John Doe', 'John', 'https://i.pravatar.cc/150?img=1', 'Lagos, Nigeria', 'Event organizer looking for talented performers', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'sarah_smith', 'Sarah Smith', 'Sarah', 'https://i.pravatar.cc/150?img=5', 'Abuja, Nigeria', 'Wedding planner seeking professional entertainers', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'mike_jones', 'Mike Jones', 'Mike', 'https://i.pravatar.cc/150?img=12', 'Port Harcourt, Nigeria', 'Corporate event manager', false, 'offline', NULL, false, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'emma_wilson', 'Emma Wilson', 'Emma', 'https://i.pravatar.cc/150?img=9', 'Ibadan, Nigeria', 'Looking for quality entertainment services', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'david_brown', 'David Brown', 'David', 'https://i.pravatar.cc/150?img=15', 'Kano, Nigeria', 'Party organizer', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'lisa_anderson', 'Lisa Anderson', 'Lisa', 'https://i.pravatar.cc/150?img=20', 'Lagos, Nigeria', 'Event coordinator', false, 'offline', NULL, false, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'james_taylor', 'James Taylor', 'James', 'https://i.pravatar.cc/150?img=33', 'Abuja, Nigeria', 'Corporate client', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'olivia_martin', 'Olivia Martin', 'Olivia', 'https://i.pravatar.cc/150?img=47', 'Port Harcourt, Nigeria', 'Wedding client', false, 'offline', NULL, true, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'william_davis', 'William Davis', 'William', 'https://i.pravatar.cc/150?img=52', 'Ibadan, Nigeria', 'Looking for professional services', false, 'offline', NULL, false, NOW(), NOW()),
        (gen_random_uuid(), 'client', 'sophia_garcia', 'Sophia Garcia', 'Sophia', 'https://i.pravatar.cc/150?img=68', 'Lagos, Nigeria', 'Event management professional', false, 'offline', NULL, true, NOW(), NOW())
    ON CONFLICT (username) DO NOTHING;

    -- ============================================
    -- Create Talent Profiles (15 talents)
    -- ============================================
    INSERT INTO profiles (id, role, username, full_name, display_name, avatar_url, location, bio, is_verified, status, starting_price, push_notifications_enabled, created_at, updated_at)
    VALUES
        (gen_random_uuid(), 'talent', 'grace_actor', 'Grace Okafor', 'Grace', 'https://i.pravatar.cc/150?img=11', 'Lagos, Nigeria', 'Professional actress with 10+ years experience in theater and film', true, 'online', 5000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'chidi_comic', 'Chidi Nwankwo', 'Chidi', 'https://i.pravatar.cc/150?img=13', 'Abuja, Nigeria', 'Stand-up comedian and MC. Making people laugh since 2015', true, 'online', 3000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'amara_dancer', 'Amara Okoro', 'Amara', 'https://i.pravatar.cc/150?img=24', 'Lagos, Nigeria', 'Professional dancer specializing in Afrobeat and contemporary', true, 'online', 4000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'tunde_host', 'Tunde Adebayo', 'Tunde', 'https://i.pravatar.cc/150?img=16', 'Port Harcourt, Nigeria', 'Experienced MC and event host for weddings and corporate events', true, 'offline', 3500, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'zara_model', 'Zara Ibrahim', 'Zara', 'https://i.pravatar.cc/150?img=28', 'Lagos, Nigeria', 'Fashion and commercial model. Featured in top magazines', true, 'online', 6000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'ken_photographer', 'Ken Eze', 'Ken', 'https://i.pravatar.cc/150?img=30', 'Abuja, Nigeria', 'Professional photographer specializing in events and portraits', true, 'online', 4500, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'bella_singer', 'Bella Adeyemi', 'Bella', 'https://i.pravatar.cc/150?img=32', 'Lagos, Nigeria', 'Soulful vocalist and performer. Available for events and recordings', true, 'online', 5000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'segun_video', 'Segun Ojo', 'Segun', 'https://i.pravatar.cc/150?img=35', 'Ibadan, Nigeria', 'Professional videographer and video editor', true, 'offline', 5500, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'nkem_actress', 'Nkem Onyeka', 'Nkem', 'https://i.pravatar.cc/150?img=38', 'Lagos, Nigeria', 'Versatile actress for theater and screen', false, 'online', 4000, false, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'bayo_comic', 'Bayo Adekunle', 'Bayo', 'https://i.pravatar.cc/150?img=40', 'Abuja, Nigeria', 'Comedy performer and content creator', true, 'online', 2500, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'chioma_dancer', 'Chioma Nwosu', 'Chioma', 'https://i.pravatar.cc/150?img=42', 'Port Harcourt, Nigeria', 'Dance instructor and performer', true, 'booked', 3500, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'femi_mc', 'Femi Ogunleye', 'Femi', 'https://i.pravatar.cc/150?img=44', 'Lagos, Nigeria', 'Dynamic MC and event host', true, 'online', 3000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'temi_model', 'Temi Adebisi', 'Temi', 'https://i.pravatar.cc/150?img=46', 'Abuja, Nigeria', 'Fashion model and brand ambassador', false, 'online', 5000, false, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'ade_photo', 'Ade Ogunlade', 'Ade', 'https://i.pravatar.cc/150?img=48', 'Lagos, Nigeria', 'Creative photographer for all occasions', true, 'online', 4000, true, NOW(), NOW()),
        (gen_random_uuid(), 'talent', 'wumi_vocalist', 'Wumi Adegoke', 'Wumi', 'https://i.pravatar.cc/150?img=50', 'Ibadan, Nigeria', 'Gospel and contemporary singer', true, 'offline', 4500, true, NOW(), NOW())
    ON CONFLICT (username) DO NOTHING;

    -- ============================================
    -- Create Wallets for all users
    -- ============================================
    INSERT INTO wallets (user_id, balance, escrow_balance, created_at, updated_at)
    SELECT
        id,
        CASE
            WHEN role = 'client' THEN (1000 + (random() * 9000)::int) * 100
            WHEN role = 'talent' THEN (500 + (random() * 4500)::int) * 100
            ELSE 0
        END,
        CASE
            WHEN role = 'talent' THEN (100 + (random() * 400)::int) * 100
            ELSE 0
        END,
        NOW(),
        NOW()
    FROM profiles
    ON CONFLICT (user_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        escrow_balance = EXCLUDED.escrow_balance;

    -- ============================================
    -- Get Talent IDs for menu creation
    -- ============================================
    SELECT id INTO grace_id FROM profiles WHERE username = 'grace_actor';
    SELECT id INTO chidi_id FROM profiles WHERE username = 'chidi_comic';
    SELECT id INTO amara_id FROM profiles WHERE username = 'amara_dancer';
    SELECT id INTO tunde_id FROM profiles WHERE username = 'tunde_host';
    SELECT id INTO zara_id FROM profiles WHERE username = 'zara_model';
    SELECT id INTO ken_id FROM profiles WHERE username = 'ken_photographer';
    SELECT id INTO bella_id FROM profiles WHERE username = 'bella_singer';
    SELECT id INTO segun_id FROM profiles WHERE username = 'segun_video';
    SELECT id INTO nkem_id FROM profiles WHERE username = 'nkem_actress';
    SELECT id INTO bayo_id FROM profiles WHERE username = 'bayo_comic';
    SELECT id INTO chioma_id FROM profiles WHERE username = 'chioma_dancer';
    SELECT id INTO femi_id FROM profiles WHERE username = 'femi_mc';
    SELECT id INTO temi_id FROM profiles WHERE username = 'temi_model';
    SELECT id INTO ade_id FROM profiles WHERE username = 'ade_photo';
    SELECT id INTO wumi_id FROM profiles WHERE username = 'wumi_vocalist';

    -- ============================================
    -- Create Talent Menus
    -- ============================================
    INSERT INTO talent_menus (talent_id, service_type_id, price, is_active, created_at, updated_at) VALUES
        (grace_id, acting_id, 5000, true, NOW(), NOW()),
        (grace_id, hosting_id, 4000, true, NOW(), NOW()),
        (chidi_id, comedy_id, 3000, true, NOW(), NOW()),
        (chidi_id, hosting_id, 3500, true, NOW(), NOW()),
        (amara_id, dancing_id, 4000, true, NOW(), NOW()),
        (tunde_id, hosting_id, 3500, true, NOW(), NOW()),
        (tunde_id, comedy_id, 3000, true, NOW(), NOW()),
        (zara_id, modeling_id, 6000, true, NOW(), NOW()),
        (zara_id, photography_id, 5500, true, NOW(), NOW()),
        (ken_id, photography_id, 4500, true, NOW(), NOW()),
        (ken_id, videography_id, 5000, true, NOW(), NOW()),
        (bella_id, singing_id, 5000, true, NOW(), NOW()),
        (bella_id, hosting_id, 4000, true, NOW(), NOW()),
        (segun_id, videography_id, 5500, true, NOW(), NOW()),
        (segun_id, photography_id, 5000, true, NOW(), NOW()),
        (nkem_id, acting_id, 4000, true, NOW(), NOW()),
        (bayo_id, comedy_id, 2500, true, NOW(), NOW()),
        (chioma_id, dancing_id, 3500, true, NOW(), NOW()),
        (femi_id, hosting_id, 3000, true, NOW(), NOW()),
        (temi_id, modeling_id, 5000, true, NOW(), NOW()),
        (ade_id, photography_id, 4000, true, NOW(), NOW()),
        (wumi_id, singing_id, 4500, true, NOW(), NOW());

    -- ============================================
    -- Create Media for Talents
    -- ============================================
    INSERT INTO media (talent_id, url, type, is_premium, unlock_price, created_at)
    SELECT
        p.id,
        'https://picsum.photos/800/600?random=' || (ROW_NUMBER() OVER ()),
        CASE WHEN random() > 0.7 THEN 'video' ELSE 'image' END,
        CASE WHEN random() > 0.5 THEN true ELSE false END,
        CASE WHEN random() > 0.5 THEN (500 + (random() * 2000)::int) ELSE 0 END,
        NOW() - (random() * INTERVAL '30 days')
    FROM profiles p
    WHERE p.role = 'talent'
    LIMIT 45;

    -- ============================================
    -- Create Bookings (20 bookings in various states)
    -- ============================================
    SELECT ARRAY_AGG(id) INTO client_ids FROM profiles WHERE role = 'client';
    SELECT ARRAY_AGG(id) INTO talent_ids FROM profiles WHERE role = 'talent';

    FOR i IN 1..20 LOOP
        client_id := client_ids[1 + (random() * (array_length(client_ids, 1) - 1))::int];
        talent_id := talent_ids[1 + (random() * (array_length(talent_ids, 1) - 1))::int];

        SELECT jsonb_agg(
            jsonb_build_object(
                'id', tm.id,
                'service_type_id', tm.service_type_id,
                'price', tm.price,
                'service_type', jsonb_build_object(
                    'id', st.id,
                    'name', st.name,
                    'icon', st.icon
                )
            )
        ) INTO menu_items
        FROM talent_menus tm
        JOIN service_types st ON tm.service_type_id = st.id
        WHERE tm.talent_id = talent_id AND tm.is_active = true
        LIMIT 2;

        SELECT COALESCE((SELECT SUM((value->>'price')::int) FROM jsonb_array_elements(menu_items)), 5000) INTO total_price;

        INSERT INTO bookings (
            id, client_id, talent_id, total_price, services_snapshot,
            status, scheduled_at, notes, created_at, updated_at
        )
        VALUES (
            gen_random_uuid(),
            client_id,
            talent_id,
            total_price,
            menu_items,
            CASE (i % 6)
                WHEN 0 THEN 'payment_pending'
                WHEN 1 THEN 'verification_pending'
                WHEN 2 THEN 'confirmed'
                WHEN 3 THEN 'completed'
                WHEN 4 THEN 'cancelled'
                ELSE 'expired'
            END,
            CASE WHEN (i % 6) IN (2, 3) THEN NOW() + (random() * INTERVAL '7 days') ELSE NULL END,
            CASE WHEN random() > 0.5 THEN 'Looking forward to working together!' ELSE NULL END,
            NOW() - (random() * INTERVAL '60 days'),
            NOW() - (random() * INTERVAL '60 days')
        )
        RETURNING id INTO booking_id;

        IF (i % 6) = 1 THEN
            INSERT INTO verifications (
                booking_id, selfie_url, full_name, phone, gps_coords,
                status, created_at
            )
            VALUES (
                booking_id,
                'https://picsum.photos/400/400?random=' || i,
                'Test User ' || i,
                '+234' || (800000000 + (random() * 199999999)::bigint),
                '6.5244,3.3792',
                'pending',
                NOW() - (random() * INTERVAL '5 days')
            );
        END IF;
    END LOOP;

    -- ============================================
    -- Create Reviews (for completed bookings)
    -- ============================================
    INSERT INTO reviews (booking_id, client_id, talent_id, rating, comment, talent_response, talent_responded_at, created_at)
    SELECT
        b.id,
        b.client_id,
        b.talent_id,
        (3 + (random() * 2)::int),
        CASE WHEN random() > 0.3 THEN
            (ARRAY[
                'Excellent service! Highly recommended.',
                'Great experience, very professional.',
                'Amazing talent, exceeded expectations.',
                'Wonderful performance, will book again.',
                'Professional and talented. Great work!',
                'Outstanding service, very satisfied.',
                'Fantastic experience from start to finish.'
            ])[1 + (random() * 6)::int]
        ELSE NULL END,
        CASE WHEN random() > 0.6 THEN
            (ARRAY[
                'Thank you for the kind words!',
                'It was a pleasure working with you.',
                'Thank you! Looking forward to future collaborations.',
                'Appreciate the feedback!'
            ])[1 + (random() * 3)::int]
        ELSE NULL END,
        CASE WHEN random() > 0.6 THEN NOW() - (random() * INTERVAL '2 days') ELSE NULL END,
        NOW() - (random() * INTERVAL '10 days')
    FROM bookings b
    WHERE b.status = 'completed'
    LIMIT 8;

    -- ============================================
    -- Create Transactions
    -- ============================================
    INSERT INTO transactions (user_id, amount, coins, type, status, reference, description, created_at)
    SELECT
        p.id,
        CASE
            WHEN p.role = 'client' THEN -(1000 + (random() * 9000)::int)
            ELSE (500 + (random() * 4500)::int)
        END,
        CASE
            WHEN p.role = 'client' THEN -(10000 + (random() * 90000)::int)
            ELSE (5000 + (random() * 45000)::int)
        END,
        CASE
            WHEN p.role = 'client' THEN
                (ARRAY['purchase', 'booking', 'unlock', 'gift'])[1 + (random() * 3)::int]
            ELSE
                (ARRAY['payout', 'withdrawal', 'booking'])[1 + (random() * 2)::int]
        END,
        CASE WHEN random() > 0.1 THEN 'completed' ELSE 'pending' END,
        'TXN' || upper(substring(md5(random()::text) from 1 for 12)),
        CASE
            WHEN p.role = 'client' THEN 'Coin purchase'
            ELSE 'Service payment'
        END,
        NOW() - (random() * INTERVAL '90 days')
    FROM profiles p
    CROSS JOIN generate_series(1, 3)
    LIMIT 75;

    -- ============================================
    -- Create Gifts
    -- ============================================
    INSERT INTO gifts (sender_id, recipient_id, amount, message, created_at)
    SELECT
        c.id,
        t.id,
        (100 + (random() * 900)::int) * 100,
        CASE WHEN random() > 0.4 THEN
            (ARRAY[
                'Keep up the great work!',
                'You deserve this!',
                'Thank you for your amazing service!',
                'Appreciate your talent!',
                'Well done!'
            ])[1 + (random() * 4)::int]
        ELSE NULL END,
        NOW() - (random() * INTERVAL '30 days')
    FROM profiles c
    CROSS JOIN profiles t
    WHERE c.role = 'client' AND t.role = 'talent'
    ORDER BY random()
    LIMIT 15;

    -- ============================================
    -- Create Conversations and Messages
    -- ============================================
    FOR booking_id_var IN SELECT id FROM bookings WHERE status IN ('confirmed', 'completed') LIMIT 5
    LOOP
        SELECT b.client_id, b.talent_id INTO client_id, talent_id FROM bookings b WHERE b.id = booking_id_var;

        INSERT INTO conversations (id, participant_1, participant_2, booking_id, last_message_at, created_at)
        VALUES (
            gen_random_uuid(),
            client_id,
            talent_id,
            booking_id_var,
            NOW() - (random() * INTERVAL '5 days'),
            NOW() - (random() * INTERVAL '7 days')
        )
        RETURNING id INTO conv_id;

        FOR j IN 1..(3 + (random() * 5)::int) LOOP
            INSERT INTO messages (conversation_id, sender_id, content, is_read, created_at)
            VALUES (
                conv_id,
                CASE WHEN j % 2 = 0 THEN client_id ELSE talent_id END,
                (ARRAY[
                    'Hello! Looking forward to working with you.',
                    'Thanks for booking my services!',
                    'I have a few questions about the event.',
                    'Sure, I can help with that.',
                    'What time should we meet?',
                    'The event starts at 6 PM.',
                    'Perfect! See you then.',
                    'Thank you so much!'
                ])[1 + (random() * 7)::int],
                CASE WHEN random() > 0.3 THEN true ELSE false END,
                NOW() - (random() * INTERVAL '5 days') + (j * INTERVAL '1 hour')
            );
        END LOOP;
    END LOOP;

    -- ============================================
    -- Create Notifications
    -- ============================================
    INSERT INTO notifications (user_id, type, title, message, data, is_read, created_at)
    SELECT
        p.id,
        (ARRAY[
            'booking_request', 'booking_accepted', 'booking_completed',
            'gift_received', 'gift_sent', 'purchase_success',
            'media_unlocked', 'general'
        ])[1 + (random() * 7)::int],
        CASE
            WHEN random() > 0.5 THEN 'New Booking Request'
            ELSE 'Gift Received'
        END,
        CASE
            WHEN random() > 0.5 THEN 'You have a new booking request'
            ELSE 'You received a gift!'
        END,
        jsonb_build_object('test', true),
        CASE WHEN random() > 0.4 THEN false ELSE true END,
        NOW() - (random() * INTERVAL '14 days')
    FROM profiles p
    CROSS JOIN generate_series(1, 2)
    LIMIT 50;

    -- ============================================
    -- Create Withdrawal Requests
    -- ============================================
    INSERT INTO withdrawal_requests (
        talent_id, amount, bank_name, account_number, account_name,
        status, admin_notes, processed_at, created_at
    )
    SELECT
        p.id,
        (5000 + (random() * 45000)::int) * 100,
        (ARRAY['Access Bank', 'GTBank', 'First Bank', 'Zenith Bank', 'UBA'])[1 + (random() * 4)::int],
        '0' || (1000000000 + (random() * 8999999999)::bigint)::text,
        p.full_name,
        CASE (ROW_NUMBER() OVER () % 4)
            WHEN 0 THEN 'pending'
            WHEN 1 THEN 'approved'
            WHEN 2 THEN 'rejected'
            ELSE 'completed'
        END,
        CASE WHEN random() > 0.7 THEN 'Processed successfully' ELSE NULL END,
        CASE WHEN random() > 0.5 THEN NOW() - (random() * INTERVAL '7 days') ELSE NULL END,
        NOW() - (random() * INTERVAL '30 days')
    FROM profiles p
    WHERE p.role = 'talent'
    LIMIT 8;

    -- ============================================
    -- Create User Unlocks (for premium media)
    -- ============================================
    INSERT INTO user_unlocks (user_id, media_id, unlocked_at)
    SELECT
        c.id,
        m.id,
        NOW() - (random() * INTERVAL '20 days')
    FROM profiles c
    CROSS JOIN media m
    WHERE c.role = 'client' AND m.is_premium = true
    ORDER BY random()
    LIMIT 20;

END $$;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the data was created successfully:

-- SELECT COUNT(*) as total_profiles, role FROM profiles GROUP BY role;
-- SELECT COUNT(*) as total_wallets, SUM(balance) as total_balance FROM wallets;
-- SELECT COUNT(*) as total_talent_menus FROM talent_menus;
-- SELECT COUNT(*) as total_bookings, status FROM bookings GROUP BY status;
-- SELECT COUNT(*) as total_media, type, is_premium FROM media GROUP BY type, is_premium;
-- SELECT COUNT(*) as total_reviews, AVG(rating) as avg_rating FROM reviews;
-- SELECT COUNT(*) as total_transactions, type FROM transactions GROUP BY type;
-- SELECT COUNT(*) as total_gifts, SUM(amount) as total_gifted FROM gifts;
-- SELECT COUNT(*) as total_conversations FROM conversations;
-- SELECT COUNT(*) as total_messages FROM messages;
-- SELECT COUNT(*) as total_notifications, is_read FROM notifications GROUP BY is_read;
-- SELECT COUNT(*) as total_withdrawals, status FROM withdrawal_requests GROUP BY status;
