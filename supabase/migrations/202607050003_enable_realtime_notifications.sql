-- The in-app notification bell (NotificationProvider) subscribes to
-- postgres_changes on public.notifications for instant delivery. That only
-- works if the table is in the supabase_realtime publication. This was
-- previously only a manual, untracked script
-- (database/enable_realtime_notifications.sql) with no guarantee it was ever
-- run against production — tracking it here so real-time delivery is
-- guaranteed rather than assumed.

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
END $$;
