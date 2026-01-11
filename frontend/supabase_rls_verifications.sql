-- Nego RLS Policies for Verifications Table
-- Run this SQL in your Supabase SQL Editor

-- Enable RLS on verifications table (if not already enabled)
ALTER TABLE verifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own verifications (for bookings they made)
CREATE POLICY "Users can insert verifications for their bookings"
ON verifications
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = verifications.booking_id 
    AND bookings.client_id = auth.uid()
  )
);

-- Policy: Users can view verifications for their bookings (as client or talent)
CREATE POLICY "Users can view verifications for their bookings"
ON verifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = verifications.booking_id 
    AND (bookings.client_id = auth.uid() OR bookings.talent_id = auth.uid())
  )
);

-- Policy: Users can update their own verifications
CREATE POLICY "Users can update their own verifications"
ON verifications
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings 
    WHERE bookings.id = verifications.booking_id 
    AND bookings.client_id = auth.uid()
  )
);

-- Also ensure transactions table has proper RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own transactions
CREATE POLICY "Users can insert own transactions"
ON transactions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can view their own transactions
CREATE POLICY "Users can view own transactions"
ON transactions
FOR SELECT
USING (auth.uid() = user_id);

-- Ensure wallets table allows updates for own wallet
DROP POLICY IF EXISTS "Users can update own wallet" ON wallets;
CREATE POLICY "Users can update own wallet"
ON wallets
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Optional: Create storage bucket for verifications (run in Storage section)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('verifications', 'verifications', false);
