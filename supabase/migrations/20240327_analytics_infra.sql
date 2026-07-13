-- Analytics Infrastructure Migration
-- Adds tracking for profile views and last active timestamps

-- 1. Profile Views tracking
CREATE TABLE IF NOT EXISTS profile_views (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    talent_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- Null if guest
    viewer_ip TEXT, -- Optional, for unique guest tracking
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_profile_views_talent_id ON profile_views(talent_id);
CREATE INDEX IF NOT EXISTS idx_profile_views_created_at ON profile_views(created_at);

-- 2. Last Active tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMPTZ DEFAULT NOW();

-- Function to update last_active_at
CREATE OR REPLACE FUNCTION update_last_active_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles 
    SET last_active_at = NOW() 
    WHERE id = NEW.user_id; -- For tables with user_id
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Specific function for bookings where we have both client and talent
CREATE OR REPLACE FUNCTION update_booking_active_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_active_at = NOW() WHERE id = NEW.client_id;
    UPDATE profiles SET last_active_at = NOW() WHERE id = NEW.talent_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for activity tracking
DROP TRIGGER IF EXISTS tr_on_booking_activity ON bookings;
CREATE TRIGGER tr_on_booking_activity
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_booking_active_at();

DROP TRIGGER IF EXISTS tr_on_message_activity ON messages;
CREATE TRIGGER tr_on_message_activity
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_last_active_at();
    
-- Note: Messages table uses sender_id. Let's adjust the function.

CREATE OR REPLACE FUNCTION update_message_active_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE profiles SET last_active_at = NOW() WHERE id = NEW.sender_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_on_message_activity ON messages;
CREATE TRIGGER tr_on_message_activity
    AFTER INSERT ON messages
    FOR EACH ROW EXECUTE FUNCTION update_message_active_at();

-- RLS for profile_views
ALTER TABLE profile_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all profile views" ON profile_views
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "System can insert profile views" ON profile_views
    FOR INSERT WITH CHECK (true);
