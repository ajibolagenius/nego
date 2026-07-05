-- Remove the raw DB triggers that inserted notification rows directly and
-- unconditionally, bypassing notification_preferences entirely and never
-- sending push/email for these events (booking_request, gift_received).
--
-- Both events are now dispatched from the application layer (via
-- notifyTargets/notifyUser in src/lib/notifications.ts), which checks
-- notification_preferences per channel and also sends push + email, not
-- just an in-app row.

DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
DROP FUNCTION IF EXISTS public.notify_talent_on_booking();

DROP TRIGGER IF EXISTS on_gift_created ON public.gifts;
DROP FUNCTION IF EXISTS public.notify_gift_received();
