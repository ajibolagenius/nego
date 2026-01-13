-- Reviews & Ratings System
-- Run this in your Supabase SQL Editor

-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  talent_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  talent_response TEXT,
  talent_responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_reviews_talent_id ON reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON reviews(booking_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON reviews(created_at DESC);

-- Create unique constraint to prevent duplicate reviews per booking
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_booking ON reviews(booking_id);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for reviews

-- Anyone can read reviews (for talent profiles)
CREATE POLICY "Reviews are publicly readable"
  ON reviews FOR SELECT
  USING (true);

-- Clients can create reviews for their completed bookings
CREATE POLICY "Clients can create reviews for their completed bookings"
  ON reviews FOR INSERT
  WITH CHECK (
    auth.uid() = client_id
    AND EXISTS (
      SELECT 1 FROM bookings 
      WHERE bookings.id = booking_id 
      AND bookings.client_id = auth.uid()
      AND bookings.status = 'completed'
    )
  );

-- Clients can update their own reviews (comment only, not rating after 24h)
CREATE POLICY "Clients can update their own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = client_id)
  WITH CHECK (auth.uid() = client_id);

-- Talents can add responses to reviews about them
CREATE POLICY "Talents can respond to their reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = talent_id)
  WITH CHECK (
    auth.uid() = talent_id
    -- Only allow updating response fields
  );

-- Create function to calculate average rating for a talent
CREATE OR REPLACE FUNCTION get_talent_rating(p_talent_id UUID)
RETURNS TABLE (average_rating NUMERIC, review_count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0) as average_rating,
    COUNT(*)::bigint as review_count
  FROM reviews
  WHERE talent_id = p_talent_id;
END;
$$ LANGUAGE plpgsql;

-- Add expired status to bookings if not exists
DO $$ 
BEGIN
  -- Check if 'expired' is already in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'expired' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'booking_status')
  ) THEN
    ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'expired';
  END IF;
EXCEPTION
  WHEN others THEN
    -- Type might not exist or already have the value
    NULL;
END $$;

-- Grant necessary permissions
GRANT SELECT ON reviews TO authenticated;
GRANT INSERT ON reviews TO authenticated;
GRANT UPDATE ON reviews TO authenticated;
