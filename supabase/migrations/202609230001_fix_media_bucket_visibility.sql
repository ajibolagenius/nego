-- Fix: talent profile media (photos/videos) went blank for everyone after
-- 202609180001_add_chat_media.sql flipped the shared 'media' bucket to
-- private. Talent uploads store a public URL (getPublicUrl) and are meant
-- to be visible to everyone; chat attachments need private, participant-only
-- access. Give chat its own bucket instead of sharing one with conflicting
-- access requirements, and restore 'media' to public.

-- 1. Dedicated private bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'chat-media',
    'chat-media',
    false,
    26214400, -- 25 MB
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
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop the chat policies that were scoped to the shared 'media' bucket
DROP POLICY IF EXISTS "Participants can upload chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can view chat media" ON storage.objects;
DROP POLICY IF EXISTS "Participants can delete chat media" ON storage.objects;

-- 3. Recreate them scoped to 'chat-media' (paths stay chat/<conversation_id>/<file>)
CREATE POLICY "Participants can upload chat media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'chat-media' AND
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
    bucket_id = 'chat-media' AND
    (storage.foldername(name))[1] = 'chat' AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = (storage.foldername(name))[2]
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
);

CREATE POLICY "Participants can delete chat media"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'chat-media' AND
    (storage.foldername(name))[1] = 'chat' AND
    EXISTS (
        SELECT 1 FROM public.conversations c
        WHERE c.id::text = (storage.foldername(name))[2]
        AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
);

-- 4. Restore the talent-media bucket to public so existing and new
-- getPublicUrl() links (stored in the media table) work again.
UPDATE storage.buckets SET public = true WHERE id = 'media';
