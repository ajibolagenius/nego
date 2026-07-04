-- Security fix: harden unlock_media so price and payee are authoritative from the
-- database, and the caller can only unlock for themselves.
--
-- The previous version took p_unlock_price and p_talent_id as parameters and trusted
-- them. Because the function is granted to `authenticated` and is SECURITY DEFINER, a
-- logged-in user could call it directly and (a) pass any price (e.g. 1 coin) or
-- (b) set p_talent_id to their own wallet to get a free self-cancelling unlock.
--
-- This version:
--   * takes only p_user_id and p_media_id
--   * looks up unlock_price and talent_id from the media row
--   * requires the media to be premium with a positive price
--   * refuses to unlock the caller's own content
--   * enforces p_user_id = auth.uid() so it can't be driven on behalf of another user

-- Drop EVERY existing unlock_media overload before recreating the secure one.
-- Several client-priced variants have shipped over time (NUMERIC- and INTEGER-priced),
-- and Postgres treats each argument list as a distinct function. Dropping them by name
-- via the catalog guarantees no insecure overload survives, whatever its signature.
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN
        SELECT oid::regprocedure AS sig
        FROM pg_proc
        WHERE proname = 'unlock_media'
          AND pronamespace = 'public'::regnamespace
    LOOP
        EXECUTE 'DROP FUNCTION ' || r.sig::text;
    END LOOP;
END $$;

CREATE OR REPLACE FUNCTION unlock_media(
    p_user_id UUID,
    p_media_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_talent_id UUID;
    v_unlock_price NUMERIC;
    v_is_premium BOOLEAN;
    v_user_balance NUMERIC;
    v_talent_balance NUMERIC;
    v_already_unlocked BOOLEAN;
    v_new_user_balance NUMERIC;
BEGIN
    -- The caller may only unlock content for themselves. auth.uid() is derived from
    -- the JWT of the calling user even though this runs as SECURITY DEFINER.
    IF auth.uid() IS NULL OR auth.uid() <> p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'Forbidden');
    END IF;

    -- Look up authoritative price + owner from the media row.
    SELECT talent_id, unlock_price, is_premium
    INTO v_talent_id, v_unlock_price, v_is_premium
    FROM media
    WHERE id = p_media_id;

    IF v_talent_id IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Content not found');
    END IF;

    IF NOT v_is_premium OR v_unlock_price IS NULL OR v_unlock_price <= 0 THEN
        RETURN json_build_object('success', false, 'error', 'This content is not available for unlock');
    END IF;

    -- Cannot unlock your own content.
    IF v_talent_id = p_user_id THEN
        RETURN json_build_object('success', false, 'error', 'You cannot unlock your own content');
    END IF;

    -- Already unlocked?
    SELECT EXISTS(
        SELECT 1 FROM user_unlocks
        WHERE user_id = p_user_id AND media_id = p_media_id
    ) INTO v_already_unlocked;

    IF v_already_unlocked THEN
        RETURN json_build_object('success', false, 'error', 'This content is already unlocked');
    END IF;

    -- Balances.
    SELECT balance INTO v_user_balance FROM wallets WHERE user_id = p_user_id;
    IF v_user_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'User wallet not found');
    END IF;

    IF v_user_balance < v_unlock_price THEN
        RETURN json_build_object(
            'success', false,
            'error', format('Insufficient balance. You need %s coins but only have %s coins.', v_unlock_price, v_user_balance)
        );
    END IF;

    SELECT balance INTO v_talent_balance FROM wallets WHERE user_id = v_talent_id;
    IF v_talent_balance IS NULL THEN
        RETURN json_build_object('success', false, 'error', 'Talent wallet not found');
    END IF;

    v_new_user_balance := v_user_balance - v_unlock_price;

    BEGIN
        UPDATE wallets SET balance = v_new_user_balance WHERE user_id = p_user_id;
        UPDATE wallets SET balance = v_talent_balance + v_unlock_price WHERE user_id = v_talent_id;

        INSERT INTO user_unlocks (user_id, media_id)
        VALUES (p_user_id, p_media_id)
        ON CONFLICT (user_id, media_id) DO NOTHING;

        INSERT INTO transactions (user_id, amount, coins, type, status, reference_id, description)
        VALUES
            (p_user_id, -v_unlock_price, -v_unlock_price, 'premium_unlock', 'completed', p_media_id, 'Unlocked premium content'),
            (v_talent_id, v_unlock_price, v_unlock_price, 'premium_unlock', 'completed', p_media_id, 'Content unlock payment');

        RETURN json_build_object(
            'success', true,
            'message', 'Content unlocked successfully',
            'new_balance', v_new_user_balance
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN json_build_object('success', false, 'error', 'Failed to process unlock. Please try again.');
    END;
END;
$$;

GRANT EXECUTE ON FUNCTION unlock_media(UUID, UUID) TO authenticated;

COMMENT ON FUNCTION unlock_media(UUID, UUID) IS 'Unlocks premium media for the calling user. Price and payee are read from the media row; caller must equal p_user_id.';
