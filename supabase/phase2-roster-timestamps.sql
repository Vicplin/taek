-- Add timestamp columns to coach_roster for invitation flow
alter table public.coach_roster
  add column if not exists invited_at timestamptz default now(),
  add column if not exists responded_at timestamptz;
