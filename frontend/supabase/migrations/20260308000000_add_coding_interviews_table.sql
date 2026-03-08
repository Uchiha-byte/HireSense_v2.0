-- Create table to track optional coding interviews linked to references
-- This avoids modifying existing applicant/reference-related tables.

create table if not exists public.coding_interviews (
  id uuid primary key default gen_random_uuid(),
  reference_id text not null,
  candidate_name text,
  reference_name text,
  email text,
  meeting_date text,
  coding_interview_url text,
  created_at timestamptz not null default timezone('utc', now())
);

