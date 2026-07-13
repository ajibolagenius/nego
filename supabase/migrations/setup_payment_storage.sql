-- Create storage bucket for payment proofs
INSERT INTO
    storage.buckets (id, name, public)
VALUES (
        'payment_proofs',
        'payment_proofs',
        true
    ) ON CONFLICT (id) DO NOTHING;

-- Policy: Users can upload their own proofs
CREATE POLICY "Users can upload payment proofs" ON storage.objects FOR
INSERT
WITH
    CHECK (
        bucket_id = 'payment_proofs'
        AND auth.uid () = owner
    );

-- Policy: Users can view their own proofs
CREATE POLICY "Users can view own payment proofs" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payment_proofs'
        AND auth.uid () = owner
    );

-- Policy: Admins can view all proofs
CREATE POLICY "Admins can view all payment proofs" ON storage.objects FOR
SELECT USING (
        bucket_id = 'payment_proofs'
        AND EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role = 'admin'
        )
    );