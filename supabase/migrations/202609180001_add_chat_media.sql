-- Migration: Add media support to chat messages
-- Run this in Supabase SQL editor or CLI

-- 1. Add media columns to messages table
ALTER TABLE public.messages 
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT CHECK (media_type IN ('image', 'video'));

-- 2. Make content nullable or default to empty string so media-only messages can be sent
ALTER TABLE public.messages ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.messages ALTER COLUMN content SET DEFAULT '';

-- 3. Add or update check constraints scoped specifically to public.messages
DO $$
BEGIN
    -- Drop previous version of check_content_or_media if exists on public.messages
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_content_or_media' 
        AND conrelid = 'public.messages'::regclass
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT check_content_or_media;
    END IF;

    -- Add trimmed content or media check
    ALTER TABLE public.messages ADD CONSTRAINT check_content_or_media 
        CHECK (BTRIM(COALESCE(content, '')) <> '' OR media_url IS NOT NULL);

    -- Add or recreate media pair check (both NULL or both non-NULL)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'check_media_pair' 
        AND conrelid = 'public.messages'::regclass
    ) THEN
        ALTER TABLE public.messages DROP CONSTRAINT check_media_pair;
    END IF;

    ALTER TABLE public.messages ADD CONSTRAINT check_media_pair 
        CHECK (
            (media_url IS NULL AND media_type IS NULL) OR 
            (media_url IS NOT NULL AND media_type IS NOT NULL)
        );
END $$;

-- 4. Ensure storage bucket for media exists with size limit (25MB) and allowed MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'media',
    'media',
    true,
    26214400, -- 25 MB file size limit
    ARRAY[
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
)
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 5. Drop outdated open upload policy if present
DROP POLICY IF EXISTS "Authenticated users can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can delete chat media" ON storage.objects;

-- Storage object policies enforcing conversation participation for chat objects
-- Path format: chat/<conversation_id>/<file_name>
CREATE POLICY "Participants can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'chat' AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = (storage.foldername(name))[2]
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
);

CREATE POLICY "Participants can view chat media"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'media' AND
    (
        (storage.foldername(name))[1] <> 'chat' OR
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id::text = (storage.foldername(name))[2]
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    )
);

CREATE POLICY "Participants can delete chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'media' AND
    (storage.foldername(name))[1] = 'chat' AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = (storage.foldername(name))[2]
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
);
