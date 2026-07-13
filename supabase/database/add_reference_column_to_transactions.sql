-- Add reference column to transactions table if it doesn't exist
-- This column stores the Paystack payment reference for tracking

DO $$
BEGIN
  -- Check if reference column exists, if not, add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'transactions' AND column_name = 'reference'
  ) THEN
    ALTER TABLE public.transactions ADD COLUMN reference TEXT;

    -- Create index for faster lookups
    CREATE INDEX IF NOT EXISTS idx_transactions_reference ON transactions(reference);

    -- Add comment
    COMMENT ON COLUMN public.transactions.reference IS 'Paystack payment reference for tracking transactions';
  END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'transactions' AND column_name = 'reference';
