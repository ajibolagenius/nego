-- Notifications and Withdrawals Tables for Nego
-- Run this in Supabase SQL Editor

-- Create notification type enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'booking_request',
        'booking_accepted', 
        'booking_rejected',
        'booking_completed',
        'withdrawal_approved',
        'withdrawal_rejected',
        'general'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create withdrawal status enum
DO $$ BEGIN
    CREATE TYPE withdrawal_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type notification_type NOT NULL DEFAULT 'general',
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Withdrawal requests table
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0),
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_name TEXT NOT NULL,
    status withdrawal_status DEFAULT 'pending',
    admin_notes TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_talent_id ON withdrawal_requests(talent_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- RLS Policies for withdrawal_requests
CREATE POLICY "Talents can view their own withdrawals"
    ON withdrawal_requests FOR SELECT
    USING (auth.uid() = talent_id OR EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

CREATE POLICY "Talents can create withdrawal requests"
    ON withdrawal_requests FOR INSERT
    WITH CHECK (auth.uid() = talent_id);

CREATE POLICY "Admins can update withdrawal requests"
    ON withdrawal_requests FOR UPDATE
    USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ));

-- Grant permissions
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON withdrawal_requests TO authenticated;

-- Function to create notification when booking is created
CREATE OR REPLACE FUNCTION notify_talent_on_booking()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notifications (user_id, type, title, message, data)
    VALUES (
        NEW.talent_id,
        'booking_request',
        'New Booking Request!',
        'You have a new booking request. Check it out and respond!',
        jsonb_build_object('booking_id', NEW.id, 'total_price', NEW.total_price)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new bookings (only when status changes to verification_pending)
DROP TRIGGER IF EXISTS on_booking_created ON bookings;
CREATE TRIGGER on_booking_created
    AFTER INSERT OR UPDATE ON bookings
    FOR EACH ROW
    WHEN (NEW.status = 'verification_pending')
    EXECUTE FUNCTION notify_talent_on_booking();

SELECT 'Notifications and Withdrawals tables created successfully!' as status;
