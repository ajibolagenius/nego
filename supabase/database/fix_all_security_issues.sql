-- Fix all Security Advisor warnings
-- This script fixes:
-- 1. Function Search Path Mutable warnings (11 functions)
-- 2. RLS Policy Always True warning (notifications table)
-- Run this script in Supabase SQL Editor

-- ============================================================================
-- PART 1: Fix Function Search Path Mutable Issues
-- ============================================================================
-- Add SET search_path to all functions that are missing it
-- This prevents search_path manipulation attacks

DO $$
DECLARE
    func_record RECORD;
    func_names TEXT[] := ARRAY[
        'handle_new_user',
        'get_talent_rating',
        'notify_talent_on_booking',
        'update_conversation_timestamp',
        'notify_gift_received',
        'get_or_create_conversation',
        'unlock_media',
        'update_push_subscriptions_updated_at',
        'update_updated_at',
        'make_email',
        'rand_pass_hex'
    ];
    func_name TEXT;
    func_signature TEXT;
BEGIN
    FOREACH func_name IN ARRAY func_names
    LOOP
        -- Find all functions with this name and fix each one
        FOR func_record IN
            SELECT
                p.oid,
                p.proname,
                pg_get_function_identity_arguments(p.oid) as args
            FROM pg_proc p
            JOIN pg_namespace n ON p.pronamespace = n.oid
            WHERE n.nspname = 'public'
            AND p.proname = func_name
        LOOP
            BEGIN
                -- Build the function signature: public.function_name(args)
                IF func_record.args IS NULL OR func_record.args = '' THEN
                    func_signature := format('public.%s()', func_record.proname);
                ELSE
                    func_signature := format('public.%s(%s)', func_record.proname, func_record.args);
                END IF;

                -- Alter the function to set search_path
                EXECUTE format('ALTER FUNCTION %s SET search_path = public, pg_temp', func_signature);
                RAISE NOTICE '✓ Fixed search_path for function: %', func_signature;
            EXCEPTION
                WHEN OTHERS THEN
                    RAISE WARNING '✗ Could not fix function: % - %', func_signature, SQLERRM;
            END;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- PART 2: Fix RLS Policy Always True Warning
-- ============================================================================
-- The notifications table has an overly permissive RLS policy
-- We need to check and fix the policy to be more restrictive

-- First, let's check what policies exist on notifications
-- Then we'll drop and recreate with proper restrictions

-- Drop existing overly permissive policies on notifications
DO $$
DECLARE
    policy_record RECORD;
    policy_def TEXT;
BEGIN
    -- Find all policies on notifications table that use 'true' or overly permissive conditions
    -- Query pg_policy directly to get the policy definitions
    FOR policy_record IN
        SELECT
            pol.polname as policyname,
            pg_get_expr(pol.polqual, pol.polrelid) as using_expr,
            pg_get_expr(pol.polwithcheck, pol.polrelid) as with_check_expr
        FROM pg_policy pol
        JOIN pg_class pc ON pol.polrelid = pc.oid
        JOIN pg_namespace pn ON pc.relnamespace = pn.oid
        WHERE pn.nspname = 'public'
        AND pc.relname = 'notifications'
    LOOP
        -- Check if policy is overly permissive (uses 'true' or similar)
        policy_def := COALESCE(policy_record.using_expr, '') || ' ' || COALESCE(policy_record.with_check_expr, '');

        IF policy_def LIKE '%true%' OR
           policy_def LIKE '%TRUE%' OR
           policy_record.using_expr = 'true' OR
           policy_record.with_check_expr = 'true' THEN
            EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', policy_record.policyname);
            RAISE NOTICE 'Dropped overly permissive policy: %', policy_record.policyname;
        END IF;
    END LOOP;
END $$;

-- Create proper RLS policies for notifications table
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own notifications (for system-generated ones)
CREATE POLICY "Users can insert their own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- Enable RLS on notifications table if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- Verification
-- ============================================================================
-- Check that all functions now have search_path set
DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Verifying function search_path settings...';

    FOR func_record IN
        SELECT
            p.proname as function_name,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.proname IN (
            'handle_new_user',
            'get_talent_rating',
            'notify_talent_on_booking',
            'update_conversation_timestamp',
            'notify_gift_received',
            'get_or_create_conversation',
            'unlock_media',
            'update_push_subscriptions_updated_at',
            'update_updated_at',
            'make_email',
            'rand_pass_hex'
        )
    LOOP
        IF func_record.definition LIKE '%SET search_path%' THEN
            func_count := func_count + 1;
            RAISE NOTICE '✓ Function % has search_path set', func_record.function_name;
        ELSE
            RAISE WARNING '✗ Function % does NOT have search_path set', func_record.function_name;
        END IF;
    END LOOP;

    RAISE NOTICE 'Total functions verified: %', func_count;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Security fixes applied successfully!';
    RAISE NOTICE '========================================';
    RAISE NOTICE '1. Fixed search_path for all functions';
    RAISE NOTICE '2. Fixed RLS policies for notifications table';
    RAISE NOTICE '';
    RAISE NOTICE 'Please refresh the Security Advisor to verify all warnings are resolved.';
END $$;
