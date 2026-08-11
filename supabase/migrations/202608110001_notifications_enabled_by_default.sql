-- Fix the global "notifications are not working" bug.
--
-- ROOT CAUSE
-- ----------
-- `supabase_push_subscriptions.sql` originally added
-- `profiles.push_notifications_enabled BOOLEAN DEFAULT false`, so every profile
-- created before that default changed was silently opted OUT of push.
--
-- `set_notification_defaults.sql` later flipped the column default to true, but
-- it only backfilled rows where the value was NULL:
--
--     UPDATE public.profiles SET push_notifications_enabled = true
--     WHERE push_notifications_enabled IS NULL;
--
-- Those rows were never NULL — they were an explicit `false` written by the old
-- column default. So the backfill matched nothing and 2,569 of 2,668 profiles
-- stayed at `false`.
--
-- `202607050001_notification_preferences.sql` then carried that value into the
-- new per-channel table verbatim:
--
--     push_enabled = COALESCE(push_notifications_enabled, true)
--
-- ...propagating the bad default to 1,779 users, of whom 282 are talents.
-- `notifyTargets()` filters push recipients on `push_enabled`, so those users
-- were dropped before a push was ever attempted. They never opted out; a
-- column default did it for them.
--
-- Because the bad backfill overwrote the entire column, a genuine opt-out is no
-- longer distinguishable from the buggy default. Every channel is therefore
-- reset to enabled — the documented product default — and users can opt out
-- again from Settings.

BEGIN;

-- 1. Repair the legacy flat flags on `profiles`. The default was already fixed
--    by set_notification_defaults.sql; this backfills the rows that migration
--    missed by only matching NULL.
UPDATE public.profiles
SET push_notifications_enabled = true
WHERE push_notifications_enabled IS DISTINCT FROM true;

UPDATE public.profiles
SET email_notifications_enabled = true
WHERE email_notifications_enabled IS DISTINCT FROM true;

-- 2. Guarantee one preferences row per profile. handle_new_user() inserts one,
--    but it swallows errors in its EXCEPTION block, so a failed insert leaves a
--    profile with no row. `resolvePreferences()` treats a missing row as
--    all-enabled, so this is belt-and-braces rather than a live bug.
INSERT INTO public.notification_preferences (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 3. Turn every channel back on for every user.
UPDATE public.notification_preferences
SET in_app_enabled = true,
    push_enabled   = true,
    email_enabled  = true,
    chat_enabled   = true
WHERE in_app_enabled IS NOT TRUE
   OR push_enabled   IS NOT TRUE
   OR email_enabled  IS NOT TRUE
   OR chat_enabled   IS NOT TRUE;

-- 4. Make the columns non-nullable-safe going forward. They are already
--    NOT NULL DEFAULT true, but an explicit NULL write from application code
--    would previously have been rejected with a constraint error rather than
--    falling back to the default. Coerce instead.
CREATE OR REPLACE FUNCTION public.notification_preferences_coerce_nulls()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.in_app_enabled := COALESCE(NEW.in_app_enabled, true);
    NEW.push_enabled   := COALESCE(NEW.push_enabled, true);
    NEW.email_enabled  := COALESCE(NEW.email_enabled, true);
    NEW.chat_enabled   := COALESCE(NEW.chat_enabled, true);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_preferences_coerce_nulls ON public.notification_preferences;
CREATE TRIGGER notification_preferences_coerce_nulls
    BEFORE INSERT OR UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.notification_preferences_coerce_nulls();

-- 5. Backstop for step 2: if a profile is ever created outside
--    handle_new_user() (admin tooling, a repair script, a direct insert), it
--    still gets a preferences row with every channel enabled.
CREATE OR REPLACE FUNCTION public.ensure_notification_preferences()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_ensure_notification_preferences ON public.profiles;
CREATE TRIGGER profiles_ensure_notification_preferences
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.ensure_notification_preferences();

-- 6. A push endpoint identifies one browser install, not one account. The old
--    UNIQUE(user_id, endpoint) let the same endpoint be registered to several
--    users, so after account B signed in on a device previously used by account
--    A, a push meant for A was delivered to the browser now showing B — and
--    counted as delivered. One endpoint currently has this collision.
--
--    Keep only the most recently updated row per endpoint, then enforce
--    endpoint uniqueness. /api/push/subscribe reassigns rather than duplicates.
DELETE FROM public.push_subscriptions ps
USING public.push_subscriptions keep
WHERE ps.endpoint = keep.endpoint
  AND ps.id <> keep.id
  AND (
        COALESCE(ps.updated_at, ps.created_at) < COALESCE(keep.updated_at, keep.created_at)
        OR (
            COALESCE(ps.updated_at, ps.created_at) = COALESCE(keep.updated_at, keep.created_at)
            AND ps.id < keep.id
        )
      );

DROP INDEX IF EXISTS idx_push_subscriptions_endpoint;
CREATE UNIQUE INDEX IF NOT EXISTS push_subscriptions_endpoint_key
    ON public.push_subscriptions (endpoint);

-- 7. Allow the owning user to delete their own row so the client can reassign a
--    reused endpoint. Covered by the existing DELETE policy, restated here
--    because step 6 changes what "own row" can mean for a shared endpoint.
DROP POLICY IF EXISTS "Users can delete own push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Users can delete own push subscriptions"
    ON public.push_subscriptions FOR DELETE
    USING (auth.uid() = user_id);

COMMIT;

-- Verification (run manually after applying):
--   SELECT count(*) FROM public.notification_preferences WHERE push_enabled IS NOT TRUE;   -- expect 0
--   SELECT count(*) FROM public.profiles p
--     LEFT JOIN public.notification_preferences np ON np.user_id = p.id
--     WHERE np.user_id IS NULL;                                                            -- expect 0
--   SELECT count(*) FROM (SELECT endpoint FROM public.push_subscriptions
--     GROUP BY endpoint HAVING count(*) > 1) d;                                            -- expect 0
