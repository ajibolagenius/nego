-- Fix unlock_media function to properly handle user_unlocks table and transaction type
-- This function handles premium media unlocking with proper transaction handling

CREATE OR REPLACE FUNCTION unlock_media(
    p_user_id UUID,
    p_media_id UUID,
    p_talent_id UUID,
    p_unlock_price NUMERIC
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_balance NUMERIC;
    v_talent_balance NUMERIC;
    v_already_unlocked BOOLEAN;
    v_new_user_balance NUMERIC;
BEGIN
    -- Check if content is already unlocked
    SELECT EXISTS(
        SELECT 1 FROM user_unlocks
        WHERE user_id = p_user_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN json_build_object(
            'success', false,
            'error', 'This content is already unlocked'
        );
    END IF;

    -- Get user wallet balance
    SELECT balance INTO v_user_balance
    FROM wallets
    WHERE user_id = p_user_id;

    IF v_user_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'User wallet not found'
        );
    END IF;

    -- Check if user has sufficient balance
    IF v_user_balance < p_unlock_price THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Insufficient balance. You need %s coins but only have %s coins.', p_unlock_price, v_user_balance)
        );
    END IF;

    -- Get talent wallet balance
    SELECT balance INTO v_talent_balance
    FROM wallets
    WHERE user_id = p_talent_id;

    IF v_talent_balance IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Talent wallet not found'
        );
    END IF;

    -- Calculate new balance
    v_new_user_balance := v_user_balance - p_unlock_price;

    -- Start transaction: Deduct from user, credit talent, create unlock record, create transactions
    BEGIN
        -- Deduct from user wallet
        UPDATE wallets
        SET balance = v_new_user_balance
        WHERE user_id = p_user_id;

        -- Credit talent wallet
        UPDATE wallets
        SET balance = v_talent_balance + p_unlock_price
        WHERE user_id = p_talent_id;

        -- Create unlock record in user_unlocks table
        INSERT INTO user_unlocks (user_id, media_id)
        VALUES (p_user_id, p_media_id)
        ON CONFLICT (user_id, media_id) DO NOTHING;

        -- Create transaction records
        INSERT INTO transactions (user_id, amount, coins, type, status, reference_id, description)
        VALUES
            (p_user_id, -p_unlock_price, -p_unlock_price, 'premium_unlock', 'completed', p_media_id, 'Unlocked premium content'),
            (p_talent_id, p_unlock_price, p_unlock_price, 'premium_unlock', 'completed', p_media_id, 'Content unlock payment');

        RETURN json_build_object(
            'success', true,
            'message', 'Content unlocked successfully',
            'new_balance', v_new_user_balance
        );

    EXCEPTION WHEN OTHERS THEN
        -- Rollback on error
        RETURN json_build_object(
            'success', false,
            'error', 'Failed to process unlock. Please try again.'
        );
    END;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION unlock_media(UUID, UUID, UUID, NUMERIC) TO authenticated;

-- Add comment
COMMENT ON FUNCTION unlock_media IS 'Unlocks premium media content for a user, handling wallet transactions and unlock records atomically';
