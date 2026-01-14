-- Nego Gift and Unlock Functions
-- These functions run with SECURITY DEFINER to bypass RLS
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. GIFT COINS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION send_gift(
  p_sender_id UUID,
  p_recipient_id UUID,
  p_amount INTEGER,
  p_message TEXT DEFAULT NULL,
  p_sender_name TEXT DEFAULT 'Someone',
  p_recipient_name TEXT DEFAULT 'Talent'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sender_balance INTEGER;
  v_recipient_balance INTEGER;
  v_result JSON;
BEGIN
  -- Validate input
  IF p_amount < 100 THEN
    RETURN json_build_object('success', false, 'error', 'Minimum gift amount is 100 coins');
  END IF;

  IF p_sender_id = p_recipient_id THEN
    RETURN json_build_object('success', false, 'error', 'Cannot gift to yourself');
  END IF;

  -- Get sender's balance
  SELECT balance INTO v_sender_balance
  FROM wallets
  WHERE user_id = p_sender_id;

  IF v_sender_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Sender wallet not found');
  END IF;

  IF v_sender_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get or create recipient wallet
  SELECT balance INTO v_recipient_balance
  FROM wallets
  WHERE user_id = p_recipient_id;

  IF v_recipient_balance IS NULL THEN
    INSERT INTO wallets (user_id, balance, escrow_balance)
    VALUES (p_recipient_id, 0, 0);
    v_recipient_balance := 0;
  END IF;

  -- Deduct from sender
  UPDATE wallets
  SET balance = balance - p_amount
  WHERE user_id = p_sender_id;

  -- Add to recipient
  UPDATE wallets
  SET balance = balance + p_amount
  WHERE user_id = p_recipient_id;

  -- Create gift record
  INSERT INTO gifts (sender_id, recipient_id, amount, message)
  VALUES (p_sender_id, p_recipient_id, p_amount, p_message);

  -- Create transaction records
  INSERT INTO transactions (user_id, amount, coins, type, status, description)
  VALUES 
    (p_sender_id, -p_amount, -p_amount, 'gift', 'completed', 'Gift to ' || p_recipient_name),
    (p_recipient_id, p_amount, p_amount, 'gift', 'completed', 'Gift from ' || p_sender_name);

  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    p_recipient_id,
    'general',
    'You received a gift! 🎁',
    p_sender_name || ' sent you ' || p_amount || ' coins' || COALESCE(': "' || p_message || '"', ''),
    json_build_object('gift_amount', p_amount, 'sender_id', p_sender_id)
  );

  RETURN json_build_object(
    'success', true,
    'message', 'Gift sent successfully',
    'newSenderBalance', v_sender_balance - p_amount
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 2. UNLOCK MEDIA FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION unlock_media(
  p_user_id UUID,
  p_media_id UUID,
  p_talent_id UUID,
  p_unlock_price INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_balance INTEGER;
  v_talent_balance INTEGER;
BEGIN
  -- Get user's balance
  SELECT balance INTO v_user_balance
  FROM wallets
  WHERE user_id = p_user_id;

  IF v_user_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'User wallet not found');
  END IF;

  IF v_user_balance < p_unlock_price THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  -- Get or create talent wallet
  SELECT balance INTO v_talent_balance
  FROM wallets
  WHERE user_id = p_talent_id;

  IF v_talent_balance IS NULL THEN
    INSERT INTO wallets (user_id, balance, escrow_balance)
    VALUES (p_talent_id, 0, 0);
    v_talent_balance := 0;
  END IF;

  -- Deduct from user
  UPDATE wallets
  SET balance = balance - p_unlock_price
  WHERE user_id = p_user_id;

  -- Add to talent
  UPDATE wallets
  SET balance = balance + p_unlock_price
  WHERE user_id = p_talent_id;

  -- Create transaction records
  INSERT INTO transactions (user_id, amount, coins, type, status, reference_id, description)
  VALUES 
    (p_user_id, -p_unlock_price, -p_unlock_price, 'unlock', 'completed', p_media_id::text, 'Unlocked premium content'),
    (p_talent_id, p_unlock_price, p_unlock_price, 'unlock', 'completed', p_media_id::text, 'Content unlock payment');

  RETURN json_build_object(
    'success', true,
    'message', 'Content unlocked successfully',
    'newUserBalance', v_user_balance - p_unlock_price
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$;

-- ============================================
-- 3. GRANT EXECUTE PERMISSIONS
-- ============================================

-- Allow authenticated users to execute these functions
GRANT EXECUTE ON FUNCTION send_gift TO authenticated;
GRANT EXECUTE ON FUNCTION unlock_media TO authenticated;

-- ============================================
-- DONE!
-- ============================================
-- After running this script, the API routes will call these functions
-- using supabase.rpc() which works with the anon key.
