-- Create deposit_status enum
CREATE TYPE deposit_status AS ENUM ('pending', 'approved', 'rejected');

-- Create deposit_requests table
CREATE TABLE deposit_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
    user_id UUID REFERENCES profiles (id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- In Naira
    proof_url TEXT NOT NULL,
    status deposit_status DEFAULT 'pending',
    reference TEXT UNIQUE, -- Optional reference code
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE deposit_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own requests
CREATE POLICY "Users can view own deposit requests" ON deposit_requests FOR
SELECT USING (auth.uid () = user_id);

-- Users can create requests matches their auth id
CREATE POLICY "Users can create deposit requests" ON deposit_requests FOR
INSERT
WITH
    CHECK (auth.uid () = user_id);

-- Admins can view all requests
-- Assuming admin check is done via role in profiles or simply if they have access to the table via dashboard service role,
-- but for client-side RLS, we check the role.
CREATE POLICY "Admins can view all deposit requests" ON deposit_requests FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role = 'admin'
        )
    );

-- Admins can update requests (approve/reject)
CREATE POLICY "Admins can update deposit requests" ON deposit_requests FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role = 'admin'
    )
);

-- Trigger to update updated_at
CREATE TRIGGER update_deposit_requests_updated_at BEFORE UPDATE ON deposit_requests
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX idx_deposit_requests_user ON deposit_requests (user_id);

CREATE INDEX idx_deposit_requests_status ON deposit_requests (status);