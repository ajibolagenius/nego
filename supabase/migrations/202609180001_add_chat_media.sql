-- Migration: Add media support to chat messages
-- Run this in Supabase SQL editor or CLI

-- 1. Add media columns to messages table
ALTER TABLE messages 
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- 2. Make content nullable or default to empty string so media-only messages can be sent
ALTER TABLE messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE messages ALTER COLUMN content SET DEFAULT '';

-- 3. Add check constraint to ensure message has either content or media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'check_content_or_media'
    ) THEN
        ALTER TABLE messages ADD CONSTRAINT check_content_or_media 
            CHECK (COALESCE(content, '') <> '' OR media_url IS NOT NULL);
    END IF;
END $$;

-- 4. Ensure storage bucket for media exists and has proper policies
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for authenticated users to upload chat media
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Authenticated users can upload chat media'
    ) THEN
        CREATE POLICY "Authenticated users can upload chat media"
        ON storage.objects FOR INSERT
        WITH CHECK (
            bucket_id = 'media' AND
            auth.role() = 'authenticated'
        );
    END IF;
END $$;
