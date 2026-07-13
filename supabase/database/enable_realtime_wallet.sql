-- Enable Real-time for Wallets and Transactions Tables
-- Run this in Supabase SQL Editor to enable real-time synchronization
-- This ensures wallet balance updates appear in real time across the app

-- Check if tables are already in the publication
DO $$
BEGIN
    -- Add wallets table to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'wallets'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
        RAISE NOTICE 'Added wallets table to realtime publication';
    ELSE
        RAISE NOTICE 'wallets table already in realtime publication';
    END IF;

    -- Add transactions table to realtime publication if not already there
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = 'transactions'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.transactions;
        RAISE NOTICE 'Added transactions table to realtime publication';
    ELSE
        RAISE NOTICE 'transactions table already in realtime publication';
    END IF;
END $$;

-- Verify tables are enabled
SELECT
    schemaname,
    tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
AND tablename IN ('wallets', 'transactions')
ORDER BY tablename;
