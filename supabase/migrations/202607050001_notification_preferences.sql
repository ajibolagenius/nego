-- Real per-channel notification preferences.
--
-- Until now, notification preferences were two flat booleans bolted onto
-- `profiles` (email_notifications_enabled, push_notifications_enabled), with
-- no control over in-app or chat notifications, and undocumented defaults
-- (email_notifications_enabled had no traceable migration in this repo at
-- all). This introduces a proper `notification_preferences` table with one
-- row per user, one column per channel, all defaulting to enabled so every
-- user is notified until they explicitly opt out.

CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    chat_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
    ON public.notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can update own notification preferences"
    ON public.notification_preferences FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
    ON public.notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE ON public.notification_preferences TO authenticated;

-- Backfill one row per existing profile, carrying over the two legacy flat
-- flags where set (NULL treated as enabled, matching the app's existing
-- "missing means enabled" convention) and defaulting the previously
-- non-existent channels (in-app, chat) to enabled.
INSERT INTO public.notification_preferences (user_id, in_app_enabled, push_enabled, email_enabled, chat_enabled)
SELECT
    id,
    true,
    COALESCE(push_notifications_enabled, true),
    COALESCE(email_notifications_enabled, true),
    true
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Keep updated_at current on every change.
CREATE OR REPLACE FUNCTION public.set_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS notification_preferences_set_updated_at ON public.notification_preferences;
CREATE TRIGGER notification_preferences_set_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.set_notification_preferences_updated_at();

-- Extend handle_new_user() so every newly created profile gets a
-- notification_preferences row with every channel enabled by default,
-- instead of relying on application code (which only ran on a path that
-- turned out to be dead for normal signups).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  user_role_val user_role;
BEGIN
  user_role_val := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'client'
  );

  INSERT INTO public.profiles (
    id,
    role,
    display_name,
    username,
    avatar_url,
    email,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    user_role_val,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      'User'
    ),
    NEW.raw_user_meta_data->>'username',
    COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture'
    ),
    NEW.email,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.wallets (
    user_id,
    balance,
    escrow_balance
  ) VALUES (
    NEW.id,
    0,
    0
  )
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.notification_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error in handle_new_user trigger: %', SQLERRM;
    RETURN NEW;
END;
$$;
