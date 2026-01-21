-- Migration: Admin Features
-- Adds support for content moderation, coin package management, and dispute resolution
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CONTENT MODERATION
-- ============================================

-- Add moderation fields to media table
-- Default is 'approved' so talents can upload content immediately
-- Admins can reject content later if needed
ALTER TABLE media
ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
ADD COLUMN IF NOT EXISTS moderation_notes TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES profiles(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS flagged BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS flagged_reason TEXT;

-- Update existing media without moderation_status to 'approved' (backward compatibility)
UPDATE media
SET moderation_status = 'approved'
WHERE moderation_status IS NULL;

-- Add index for moderation queries
CREATE INDEX IF NOT EXISTS idx_media_moderation_status ON media(moderation_status);
CREATE INDEX IF NOT EXISTS idx_media_flagged ON media(flagged);

-- Add suspension field to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT,
ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS suspended_by UUID REFERENCES profiles(id);

-- Add index for suspended users
CREATE INDEX IF NOT EXISTS idx_profiles_suspended ON profiles(is_suspended);

-- ============================================
-- 2. COIN PACKAGES MANAGEMENT
-- ============================================

-- Create coin_packages table
CREATE TABLE IF NOT EXISTS coin_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coins INTEGER NOT NULL CHECK (coins > 0),
    price NUMERIC(12, 2) NOT NULL CHECK (price > 0),
    price_in_kobo INTEGER NOT NULL CHECK (price_in_kobo > 0),
    display_name TEXT NOT NULL,
    description TEXT,
    popular BOOLEAN DEFAULT FALSE,
    best_value BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_coin_packages_active ON coin_packages(is_active);
CREATE INDEX IF NOT EXISTS idx_coin_packages_order ON coin_packages(display_order);

-- Insert default coin packages (migrate from code)
INSERT INTO coin_packages (id, coins, price, price_in_kobo, display_name, description, popular, best_value, display_order, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000001', 1000, 10000.00, 1000000, '1,000 Coins', 'Starter package', FALSE, FALSE, 1, TRUE),
    ('00000000-0000-0000-0000-000000000002', 5000, 50000.00, 5000000, '5,000 Coins', 'Standard package', TRUE, FALSE, 2, TRUE),
    ('00000000-0000-0000-0000-000000000003', 10000, 100000.00, 10000000, '10,000 Coins', 'Premium package - One minimum service', FALSE, TRUE, 3, TRUE),
    ('00000000-0000-0000-0000-000000000004', 25000, 250000.00, 25000000, '25,000 Coins', 'Deluxe package', FALSE, FALSE, 4, TRUE),
    ('00000000-0000-0000-0000-000000000005', 50000, 500000.00, 50000000, '50,000 Coins', 'Ultimate package', FALSE, FALSE, 5, TRUE)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. DISPUTE RESOLUTION
-- ============================================

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    client_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    dispute_type TEXT NOT NULL CHECK (dispute_type IN ('service_not_delivered', 'payment_issue', 'cancellation', 'quality_issue', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'under_review', 'resolved', 'closed', 'rejected')),
    resolution TEXT,
    resolution_notes TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- Evidence/attachments (JSON array of URLs)
    evidence_urls JSONB DEFAULT '[]'::jsonb
);

-- Add indexes for disputes
CREATE INDEX IF NOT EXISTS idx_disputes_booking ON disputes(booking_id);
CREATE INDEX IF NOT EXISTS idx_disputes_client ON disputes(client_id);
CREATE INDEX IF NOT EXISTS idx_disputes_talent ON disputes(talent_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_created ON disputes(created_at DESC);

-- Create dispute_messages table for communication
CREATE TABLE IF NOT EXISTS dispute_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dispute_id UUID REFERENCES disputes(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for dispute messages
CREATE INDEX IF NOT EXISTS idx_dispute_messages_dispute ON dispute_messages(dispute_id);
CREATE INDEX IF NOT EXISTS idx_dispute_messages_created ON dispute_messages(created_at DESC);

-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS on new tables
ALTER TABLE coin_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dispute_messages ENABLE ROW LEVEL SECURITY;

-- Coin packages: Public read, Admin write
CREATE POLICY "Coin packages are viewable by everyone"
    ON coin_packages FOR SELECT
    USING (is_active = TRUE);

CREATE POLICY "Only admins can manage coin packages"
    ON coin_packages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Disputes: Users can see their own disputes, admins can see all
CREATE POLICY "Users can view their own disputes"
    ON disputes FOR SELECT
    USING (
        client_id = auth.uid() OR
        talent_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can create disputes for their bookings"
    ON disputes FOR INSERT
    WITH CHECK (
        (client_id = auth.uid() OR talent_id = auth.uid())
        AND EXISTS (
            SELECT 1 FROM bookings
            WHERE bookings.id = booking_id
            AND (bookings.client_id = auth.uid() OR bookings.talent_id = auth.uid())
        )
    );

CREATE POLICY "Admins can update disputes"
    ON disputes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Dispute messages: Users can see messages for their disputes, admins can see all
CREATE POLICY "Users can view messages for their disputes"
    ON dispute_messages FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM disputes
            WHERE disputes.id = dispute_id
            AND (disputes.client_id = auth.uid() OR disputes.talent_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Users can send messages for their disputes"
    ON dispute_messages FOR INSERT
    WITH CHECK (
        sender_id = auth.uid()
        AND (
            EXISTS (
                SELECT 1 FROM disputes
                WHERE disputes.id = dispute_id
                AND (disputes.client_id = auth.uid() OR disputes.talent_id = auth.uid())
            )
            OR EXISTS (
                SELECT 1 FROM profiles
                WHERE profiles.id = auth.uid()
                AND profiles.role = 'admin'
            )
        )
    );

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_coin_packages_updated_at
    BEFORE UPDATE ON coin_packages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically set moderated_by
CREATE OR REPLACE FUNCTION set_moderated_by()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.moderation_status != OLD.moderation_status AND NEW.moderation_status IN ('approved', 'rejected') THEN
        NEW.moderated_by = auth.uid();
        NEW.moderated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for media moderation
CREATE TRIGGER set_media_moderated_by
    BEFORE UPDATE ON media
    FOR EACH ROW
    WHEN (OLD.moderation_status IS DISTINCT FROM NEW.moderation_status)
    EXECUTE FUNCTION set_moderated_by();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE coin_packages IS 'Manageable coin packages for purchase';
COMMENT ON TABLE disputes IS 'Dispute resolution system for bookings';
COMMENT ON TABLE dispute_messages IS 'Messages/communication within disputes';
