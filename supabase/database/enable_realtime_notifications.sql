-- Enable Real-time for Notifications Table
-- Run this in Supabase SQL Editor to enable real-time synchronization
-- This ensures notifications appear in real time across the app

-- Check if table is already in the publication
DO $$
BEGIN
    -- Add notifications table to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'notifications'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
        RAISE NOTICE 'Added notifications table to realtime publication';
    ELSE
        RAISE NOTICE 'notifications table already in realtime publication';
    END IF;
END $$;

-- Verify table is enabled
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename = 'notifications'
ORDER BY tablename;
