-- Migration for reference_calls table
CREATE TABLE IF NOT EXISTS public.reference_calls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    applicant_id UUID NOT NULL REFERENCES public.applicants(id) ON DELETE CASCADE,
    reference_name TEXT NOT NULL,
    reference_email TEXT,
    company_name TEXT,
    role_title TEXT,
    work_duration TEXT,
    phone_number TEXT,
    scheduled_time TIMESTAMPTZ,
    duration_minutes INTEGER DEFAULT 15,
    zoom_join_url TEXT,
    zoom_meeting_id TEXT,
    coding_interview_url TEXT,
    status TEXT DEFAULT 'scheduled'::text,
    actual_duration_seconds INTEGER,
    storage_path TEXT,
    transcript JSONB,
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.reference_calls ENABLE ROW LEVEL SECURITY;

-- Allow all for public (Since it's likely a test environment, or use proper auth policies based on applicant)
-- For this, let's keep it open for authenticated users but we'll use anon/service role for now, so let's allow all just to be safe with ATS integration
CREATE POLICY "Enable read access for all users" ON public.reference_calls FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON public.reference_calls FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON public.reference_calls FOR UPDATE USING (true);

-- Create a storage bucket for reference-recordings
-- Note: inserting into storage.buckets requires specific privileges.
INSERT INTO storage.buckets (id, name, public) 
VALUES ('reference-recordings', 'reference-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- Setting storage policies
CREATE POLICY "Give users authenticated access to folder 1l9y_0" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'reference-recordings');
CREATE POLICY "Give users authenticated insert to folder 1l9y_1" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'reference-recordings');
CREATE POLICY "Allow anon read" ON storage.objects FOR SELECT TO anon USING (bucket_id = 'reference-recordings');
CREATE POLICY "Allow anon insert" ON storage.objects FOR INSERT TO anon WITH CHECK (bucket_id = 'reference-recordings');
