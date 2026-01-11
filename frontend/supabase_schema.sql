-- Nego Database Schema for Supabase
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enum types
CREATE TYPE user_role AS ENUM ('client', 'talent', 'admin');
CREATE TYPE talent_status AS ENUM ('online', 'offline', 'booked');
CREATE TYPE booking_status AS ENUM ('payment_pending', 'verification_pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE verification_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE media_type AS ENUM ('image', 'video');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role user_role NOT NULL DEFAULT 'client',
    username TEXT UNIQUE,
    full_name TEXT,
    display_name TEXT,
    avatar_url TEXT,
    location TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    status talent_status DEFAULT 'offline',
    starting_price INTEGER, -- Naira, for talents only
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Wallet table
CREATE TABLE wallets (
    user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
    balance INTEGER DEFAULT 0, -- In coins
    escrow_balance INTEGER DEFAULT 0, -- Held for pending bookings
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service types (admin-defined)
CREATE TABLE service_types (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    icon TEXT,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Talent menu (prices per service)
CREATE TABLE talent_menus (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    service_type_id UUID REFERENCES service_types(id) ON DELETE CASCADE,
    price INTEGER NOT NULL, -- In Naira
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(talent_id, service_type_id)
);

-- Bookings
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    talent_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    total_price INTEGER NOT NULL,
    services_snapshot JSONB NOT NULL, -- Snapshot of selected services
    status booking_status DEFAULT 'payment_pending',
    scheduled_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Client verifications (per booking)
CREATE TABLE verifications (
    booking_id UUID PRIMARY KEY REFERENCES bookings(id) ON DELETE CASCADE,
    selfie_url TEXT NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    gps_coords TEXT,
    admin_notes TEXT,
    status verification_status DEFAULT 'pending',
    reviewed_by UUID REFERENCES profiles(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Talent media
CREATE TABLE media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type media_type DEFAULT 'image',
    is_premium BOOLEAN DEFAULT FALSE,
    unlock_price INTEGER DEFAULT 0, -- In coins
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User unlocked content
CREATE TABLE user_unlocks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    media_id UUID REFERENCES media(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, media_id)
);

-- Coin transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Positive = credit, negative = debit
    type TEXT NOT NULL, -- 'purchase', 'unlock', 'booking', 'refund', 'payout'
    reference_id UUID, -- Related booking/media ID
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_location ON profiles(location);
CREATE INDEX idx_bookings_client ON bookings(client_id);
CREATE INDEX idx_bookings_talent ON bookings(talent_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_media_talent ON media(talent_id);
CREATE INDEX idx_transactions_user ON transactions(user_id);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE talent_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE media ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Anyone can view public profiles
CREATE POLICY "Public profiles viewable by everyone" ON profiles
    FOR SELECT USING (true);

-- Profiles: Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Wallets: Users can view their own wallet
CREATE POLICY "Users can view own wallet" ON wallets
    FOR SELECT USING (auth.uid() = user_id);

-- Service types: Public read
CREATE POLICY "Service types viewable by everyone" ON service_types
    FOR SELECT USING (is_active = true);

-- Talent menus: Public read for active talents
CREATE POLICY "Talent menus viewable by everyone" ON talent_menus
    FOR SELECT USING (is_active = true);

-- Talent menus: Talents can manage their own menu
CREATE POLICY "Talents can manage own menu" ON talent_menus
    FOR ALL USING (auth.uid() = talent_id);

-- Bookings: Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
    FOR SELECT USING (
        auth.uid() = client_id OR 
        auth.uid() = talent_id
    );

-- Bookings: Clients can create bookings
CREATE POLICY "Clients can create bookings" ON bookings
    FOR INSERT WITH CHECK (auth.uid() = client_id);

-- Media: Public non-premium viewable
CREATE POLICY "Non-premium media viewable" ON media
    FOR SELECT USING (is_premium = false);

-- Media: Premium media viewable if unlocked or owner
CREATE POLICY "Premium media with conditions" ON media
    FOR SELECT USING (
        is_premium = false OR
        auth.uid() = talent_id OR
        EXISTS (
            SELECT 1 FROM user_unlocks 
            WHERE user_unlocks.media_id = media.id 
            AND user_unlocks.user_id = auth.uid()
        )
    );

-- Media: Talents can manage their media
CREATE POLICY "Talents can manage own media" ON media
    FOR ALL USING (auth.uid() = talent_id);

-- User unlocks: Users see their unlocks
CREATE POLICY "Users can view own unlocks" ON user_unlocks
    FOR SELECT USING (auth.uid() = user_id);

-- Transactions: Users see their own transactions
CREATE POLICY "Users can view own transactions" ON transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Create profile
    INSERT INTO profiles (id, role, full_name, avatar_url)
    VALUES (
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client'),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url'
    );
    
    -- Create wallet
    INSERT INTO wallets (user_id, balance)
    VALUES (NEW.id, 0);
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON wallets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_talent_menus_updated_at BEFORE UPDATE ON talent_menus
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Seed initial service types
INSERT INTO service_types (name, icon, description) VALUES
    ('Dinner Date', 'utensils', 'Elegant dinner companionship'),
    ('Event Companion', 'calendar', 'Corporate events and social gatherings'),
    ('Travel Companion', 'plane', 'Travel and vacation companionship'),
    ('Private Meeting', 'lock', 'Discreet private appointments'),
    ('Photo Session', 'camera', 'Professional photo opportunities');
