-- Add lc_status column to applicants table for technical/coding interview tracking
-- Uses the existing processing_status enum type

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.applicants'::regclass 
    AND attname = 'lc_status'
  ) THEN
    ALTER TABLE public.applicants ADD COLUMN lc_status processing_status DEFAULT 'not_provided'::processing_status;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.applicants'::regclass 
    AND attname = 'leetcode_url'
  ) THEN
    ALTER TABLE public.applicants ADD COLUMN leetcode_url text;
  END IF;
END $$;

-- Add indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_applicants_lc_status ON public.applicants(lc_status);
CREATE INDEX IF NOT EXISTS idx_applicants_leetcode_url ON public.applicants(leetcode_url);

-- Add comments for documentation
COMMENT ON COLUMN public.applicants.lc_status IS 'Status of the LeetCode-style technical coding interview (pending, processing, ready, error, not_provided, skipped)';
COMMENT ON COLUMN public.applicants.leetcode_url IS 'LeetCode profile URL for the applicant';
