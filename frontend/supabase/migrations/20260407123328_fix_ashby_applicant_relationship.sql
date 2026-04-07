-- Fix missing relationship between applicants and ashby_candidates
-- This relationship is required for the !inner join syntax in PostgREST

-- 1. Ensure HireSense_applicant_id in ashby_candidates exists and is indexed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_attribute 
    WHERE attrelid = 'public.ashby_candidates'::regclass 
    AND attname = 'HireSense_applicant_id'
  ) THEN
    ALTER TABLE public.ashby_candidates ADD COLUMN HireSense_applicant_id uuid;
  END IF;
END $$;

-- 2. Drop the existing foreign key if it has a different name or to ensure we replace it
-- Some migrations might have used different names
ALTER TABLE public.ashby_candidates DROP CONSTRAINT IF EXISTS ashby_candidates_HireSense_applicant_id_fkey;
ALTER TABLE public.ashby_candidates DROP CONSTRAINT IF EXISTS ashby_candidates_applicant_id_fkey;

-- 3. Create the definitive foreign key relationship with the expected name
ALTER TABLE public.ashby_candidates 
ADD CONSTRAINT ashby_candidates_HireSense_applicant_id_fkey 
FOREIGN KEY (HireSense_applicant_id) 
REFERENCES public.applicants(id) 
ON DELETE SET NULL;

-- 4. Create an index on the foreign key column to optimize joins
CREATE INDEX IF NOT EXISTS idx_ashby_candidates_HireSense_applicant_id 
ON public.ashby_candidates(HireSense_applicant_id);

-- 5. Add comment for PostgREST/Supabase documentation
COMMENT ON CONSTRAINT ashby_candidates_HireSense_applicant_id_fkey ON public.ashby_candidates 
IS 'Relationship to link Ashby candidates to the main HireSense applicants table.';
