-- Nego Gifting System - Database Functions
-- Updated: December 2025
-- 
-- Run this in Supabase SQL Editor to ensure gifting functions work properly.
-- These functions use SECURITY DEFINER to bypass RLS and ensure atomic operations.

-- ============================================
-- 1. DROP OLD FUNCTIONS (if they exist)
-- ============================================

DROP FUNCTION IF EXISTS send_gift(UUID, UUID, INTEGER, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS handle_gift(UUID, UUID, INTEGER, TEXT);

-- ============================================
-- 2. CREATE THE UNIFIED GIFT FUNCTION
-- ============================================

-- This function handles the complete gift transaction atomically
-- It's called via RPC from the API route as a fallback/optimization

CREATE OR REPLACE FUNCTION handle_gift(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER,
  p_message TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_balance INTEGER;
  v_gift_id UUID;
  v_sender_name TEXT;
  v_recipient_name TEXT;
BEGIN
  -- Validate inputs
  IF p_sender_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender ID is required');
  END IF;

  IF p_recipient_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Recipient ID is required');
  END IF;

  IF p_amount IS NULL OR p_amount < 100 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum gift amount is 100 coins');
  END IF;

  IF p_amount > 1000000 THEN
    RETURN json_build_object('success', false, 'error', 'Maximum gift amount is 1,000,000 coins');
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RETURN json_build_object('success', false, 'error', 'You cannot send a gift to yourself');
  END IF;

  -- Get sender's name for notification
  SELECT COALESCE(display_name, 'Someone') INTO v_sender_name
  FROM profiles
  WHERE id = p_sender_id;

  -- Get recipient's name for transaction description
  SELECT COALESCE(display_name, 'Talent') INTO v_recipient_name
  FROM profiles
  WHERE id = p_recipient_id;

  -- Lock and get sender's wallet
  SELECT balance INTO v_sender_balance
  FROM wallets
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF v_sender_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Your wallet was not found');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN json_build_object(
      'success', false, 
      'error', format('Insufficient balance. You have %s coins.', v_sender_balance)
    );
  END IF;

  -- Lock and get recipient's wallet (create if doesn't exist)
  SELECT balance INTO v_recipient_balance
  FROM wallets
  WHERE user_id = p_recipient_id
  FOR UPDATE;

  IF v_recipient_balance IS NULL THEN
    -- Create wallet for recipient
    INSERT INTO wallets (user_id, balance, escrow_balance)
    VALUES (p_recipient_id, 0, 0)
    ON CONFLICT (user_id) DO NOTHING;
    v_recipient_balance := 0;
  END IF;

  -- Deduct from sender
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE user_id = p_sender_id;

  -- Credit to recipient
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE user_id = p_recipient_id;

  -- Create gift record
  INSERT INTO gifts (sender_id, recipient_id, amount, message)
  VALUES (p_sender_id, p_recipient_id, p_amount, p_message)
  RETURNING id INTO v_gift_id;

  -- Create transaction records
  INSERT INTO transactions (user_id, amount, coins, type, status, description, reference_id)
  VALUES 
    (p_sender_id, -p_amount, -p_amount, 'gift', 'completed', 'Gift to ' || v_recipient_name, v_gift_id),
    (p_recipient_id, p_amount, p_amount, 'gift', 'completed', 'Gift from ' || v_sender_name, v_gift_id);

  -- Create notification for recipient
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_recipient_id,
    'general',
    'You received a gift! 🎁',
    CASE 
      WHEN p_message IS NOT NULL AND p_message != '' 
      THEN v_sender_name || ' sent you ' || p_amount || ' coins: "' || LEFT(p_message, 100) || CASE WHEN LENGTH(p_message) > 100 THEN '...' ELSE '' END || '"'
      ELSE v_sender_name || ' sent you ' || p_amount || ' coins'
    END,
    jsonb_build_object(
      'gift_id', v_gift_id,
      'gift_amount', p_amount,
      'sender_id', p_sender_id,
      'sender_name', v_sender_name
    )
  );

  -- Return success with new balance
  RETURN json_build_object(
    'success', true,
    'message', 'Gift sent successfully',
    'new_balance', v_sender_balance - p_amount,
    'gift_id', v_gift_id
  );

EXCEPTION WHEN OTHERS THEN
  -- Return error details
  RETURN json_build_object(
    'success', false, 
    'error', 'Transaction failed: ' || SQLERRM
  );
END;
$$;

-- ============================================
-- 3. GRANT PERMISSIONS
-- ============================================

-- Allow authenticated users to call this function
GRANT EXECUTE ON FUNCTION handle_gift(UUID, UUID, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION handle_gift(UUID, UUID, INTEGER, TEXT) TO service_role;

-- ============================================
-- 4. ENSURE GIFTS TABLE EXISTS WITH CORRECT SCHEMA
-- ============================================

-- Create gifts table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 100 AND amount <= 1000000),
  message TEXT CHECK (message IS NULL OR LENGTH(message) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their sent gifts" ON public.gifts;
DROP POLICY IF EXISTS "Users can view their received gifts" ON public.gifts;
DROP POLICY IF EXISTS "Authenticated users can create gifts" ON public.gifts;
DROP POLICY IF EXISTS "Service role can manage gifts" ON public.gifts;

-- Create RLS policies
CREATE POLICY "Users can view their sent gifts"
  ON public.gifts FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received gifts"
  ON public.gifts FOR SELECT
  USING (auth.uid() = recipient_id);

-- Note: Inserts are done via the RPC function with SECURITY DEFINER, 
-- so we don't need an insert policy for regular users.
-- But we add one for the service role just in case.
CREATE POLICY "Service role can manage gifts"
  ON public.gifts FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON public.gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at DESC);

-- ============================================
-- 5. ENSURE TRANSACTIONS TABLE HAS REQUIRED COLUMNS
-- ============================================

-- Add coins column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'coins'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN coins INTEGER;
  END IF;
END $$;

-- Add status column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'transactions' AND column_name = 'status'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN status TEXT DEFAULT 'completed';
  END IF;
END $$;

-- ============================================
-- DONE!
-- ============================================
-- After running this script:
-- 1. The handle_gift() function will be available for atomic gift transactions
-- 2. The gifts table will have proper constraints and RLS policies
-- 3. The transactions table will have all required columns
--
-- Test the function with:
-- SELECT handle_gift('sender-uuid', 'recipient-uuid', 100, 'Test message');
