-- Add the notification_type enum values that production is missing.
--
-- THIS IS THE PRIMARY CAUSE OF "notifications are not working".
--
-- `supabase/migrations/add_new_notification_types.sql` was written but never
-- applied to production — it carries no timestamp prefix, so it sorts outside
-- the ordered migration sequence and was skipped. The application's
-- `NotificationType` union in src/types/database.ts was updated to match it
-- anyway, so the code has been dispatching types the database rejects.
--
-- Probing production confirmed the enum holds only 12 of the 23 types the app
-- uses. Every dispatch of a missing type fails with:
--
--     invalid input value for enum notification_type: "message_received"
--
-- and because `notifyTargets()` returned early on an insert error, the failure
-- took push and email down with it. So those events produced NO notification on
-- ANY channel — no in-app row, no push, no email. Silently, because every call
-- site fires the dispatch with `.catch(console.error)`.
--
-- Observed impact: 3,180 messages had been sent with ZERO `message_received`
-- notifications ever created. Direct messages are how clients reach talent, so
-- talent were never told they had been contacted.
--
-- Missing values, and what each one silently broke:
--   message_received      -> every new direct message  (the big one)
--   review_received       -> a client leaving a review
--   dispute_filed         -> disputes, incl. the notification to admins
--   dispute_resolved      -> dispute outcome
--   verification_approved -> ID verification result
--   talent_verified       -> talent gaining verified status
--   talent_unverified     -> talent losing verified status
--   media_deleted         -> admin removing media
--   booking_cancelled     -> a cancelled booking
--   booking_expired       -> the daily /api/bookings/expire cron
--
-- NOTE: ALTER TYPE ... ADD VALUE must not be wrapped in an explicit
-- transaction alongside any use of the new value, so this migration
-- deliberately has no BEGIN/COMMIT. `IF NOT EXISTS` makes each statement
-- idempotent (PostgreSQL 12+).

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'message_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'review_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_filed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'dispute_resolved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'verification_approved';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'talent_verified';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'talent_unverified';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'media_deleted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_cancelled';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'booking_expired';

-- Verification (run manually after applying) — expect all 23 app types present:
--   SELECT enumlabel FROM pg_enum
--   WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
--   ORDER BY enumsortorder;
