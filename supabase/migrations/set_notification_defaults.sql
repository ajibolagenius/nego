-- Ensure email and push notifications are enabled by default for all profiles
-- This makes the default explicit rather than relying on NULL handling

ALTER TABLE public.profiles
  ALTER COLUMN email_notifications_enabled SET DEFAULT true,
  ALTER COLUMN push_notifications_enabled SET DEFAULT true;

-- Backfill existing profiles with NULL values to true
UPDATE public.profiles
SET email_notifications_enabled = true
WHERE email_notifications_enabled IS NULL;

UPDATE public.profiles
SET push_notifications_enabled = true
WHERE push_notifications_enabled IS NULL;
