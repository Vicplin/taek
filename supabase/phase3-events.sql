-- Phase 3 - Events Management
-- Create events table
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  organiser_id uuid references public.organiser_profiles(id) not null,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  venue text,
  status text check (status in ('draft', 'published', 'completed', 'cancelled')) not null default 'draft',
  registration_deadline timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Enable RLS
alter table public.events enable row level security;

-- Policies
-- Organisers can manage their own events
create policy "Organisers can manage own events"
  on public.events
  for all
  using (
    exists (
      select 1 from public.organiser_profiles
      where id = events.organiser_id
      and user_id = auth.uid()
    )
  );

-- Everyone can view published events
create policy "Everyone can view published events"
  on public.events
  for select
  using (status = 'published');

-- Allow reading all events for authenticated users (optional, depending on requirements)
-- For now, let's stick to published events for public view
