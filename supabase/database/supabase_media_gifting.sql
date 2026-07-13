-- Nego Media Manager & Gifting System
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. GIFTS TABLE - For coin gifting between users
-- ============================================

CREATE TABLE IF NOT EXISTS public.gifts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 100), -- Minimum 100 coins
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gifts ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see their own sent/received gifts
CREATE POLICY "Users can view their sent gifts"
  ON public.gifts FOR SELECT
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can view their received gifts"
  ON public.gifts FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "Authenticated users can create gifts"
  ON public.gifts FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_gifts_sender ON public.gifts(sender_id);
CREATE INDEX IF NOT EXISTS idx_gifts_recipient ON public.gifts(recipient_id);
CREATE INDEX IF NOT EXISTS idx_gifts_created_at ON public.gifts(created_at DESC);

-- ============================================
-- 2. UPDATE MEDIA TABLE - Add is_premium if not exists
-- ============================================

-- Check if column exists and add if not
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'is_premium') THEN
    ALTER TABLE public.media ADD COLUMN is_premium BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'media' AND column_name = 'unlock_price') THEN
    ALTER TABLE public.media ADD COLUMN unlock_price INTEGER DEFAULT 0;
  END IF;
END $$;

-- Create index for premium content queries
CREATE INDEX IF NOT EXISTS idx_media_is_premium ON public.media(is_premium);

-- ============================================
-- 3. ADD 'gift' TO TRANSACTION TYPES
-- ============================================

-- Update transactions to support 'gift' type (if using enum, alter it)
-- If transaction_type is a text column, no changes needed
-- The type definition in types/database.ts will handle this

-- ============================================
-- 4. STORAGE BUCKET FOR MEDIA (if not exists)
-- ============================================

-- Make sure the 'media' bucket exists and has proper policies
-- Run this in Storage section or via SQL:

INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for talents to upload media
CREATE POLICY "Talents can upload media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'media' AND
  auth.role() = 'authenticated'
);

-- Policy for public read access
CREATE POLICY "Media is publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'media');

-- Policy for talents to delete their own media
CREATE POLICY "Talents can delete their own media"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'media' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================
-- 5. GIFT NOTIFICATION TRIGGER (OPTIONAL)
-- ============================================

-- Function to create notification when gift is received
CREATE OR REPLACE FUNCTION notify_gift_received()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, data)
  VALUES (
    NEW.recipient_id,
    'general',
    'You received a gift! 🎁',
    (SELECT display_name FROM public.profiles WHERE id = NEW.sender_id) || ' sent you ' || NEW.amount || ' coins',
    jsonb_build_object(
      'gift_id', NEW.id,
      'sender_id', NEW.sender_id,
      'amount', NEW.amount,
      'message', NEW.message
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_gift_created ON public.gifts;
CREATE TRIGGER on_gift_created
  AFTER INSERT ON public.gifts
  FOR EACH ROW
  EXECUTE FUNCTION notify_gift_received();

-- ============================================
-- DONE!
-- ============================================
-- After running this script:
-- 1. The gifts table will be created
-- 2. Media table will have is_premium and unlock_price columns
-- 3. Storage bucket 'media' will be set up
-- 4. Gift notifications will be automatic
