-- Phase 0.5 — Full Database Schema Design
-- Based on requirements: UUID keys, TIMESTAMPTZ, RLS enabled

-- 1. Users (extends auth.users)
create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text unique not null,
  full_name text,
  role text check (role in ('admin', 'organiser', 'coach', 'player')) not null default 'player',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.users enable row level security;

-- 2. Clubs
create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  coach_id uuid references public.users(id) not null,
  location text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.clubs enable row level security;

-- 3. Player Profiles
create table if not exists public.player_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null unique,
  club_id uuid references public.clubs(id),
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  weight_kg numeric,
  height_cm numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.player_profiles enable row level security;

-- 4. Coach Profiles
create table if not exists public.coach_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null unique,
  club_id uuid references public.clubs(id),
  certification_level text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.coach_profiles enable row level security;

-- 5. Belt History
create table if not exists public.belt_history (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.player_profiles(id) not null,
  belt_color text not null,
  awarded_at date not null,
  awarded_by text,
  created_at timestamptz default now()
);
alter table public.belt_history enable row level security;

-- 6. Events
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  organiser_id uuid references public.users(id) not null,
  title text not null,
  description text,
  start_date timestamptz not null,
  end_date timestamptz not null,
  location text,
  status text check (status in ('draft', 'published', 'completed', 'cancelled')) default 'draft',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.events enable row level security;

-- 7. Event Categories
create table if not exists public.event_categories (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) not null,
  name text not null, -- e.g., "Senior Male Black Belt"
  type text check (type in ('sparring', 'poomsae', 'demonstration')),
  created_at timestamptz default now()
);
alter table public.event_categories enable row level security;

-- 8. Weight Classes
create table if not exists public.weight_classes (
  id uuid default gen_random_uuid() primary key,
  category_id uuid references public.event_categories(id) not null,
  name text not null, -- e.g., "Under 58kg"
  min_weight_kg numeric,
  max_weight_kg numeric,
  created_at timestamptz default now()
);
alter table public.weight_classes enable row level security;

-- 9. Registrations
create table if not exists public.registrations (
  id uuid default gen_random_uuid() primary key,
  event_id uuid references public.events(id) not null,
  player_id uuid references public.player_profiles(id) not null,
  category_id uuid references public.event_categories(id) not null,
  weight_class_id uuid references public.weight_classes(id),
  status text check (status in ('pending', 'approved', 'rejected', 'withdrawn')) default 'pending',
  payment_status text check (payment_status in ('unpaid', 'paid', 'refunded')) default 'unpaid',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.registrations enable row level security;

-- 10. Registration Docs
create table if not exists public.registration_docs (
  id uuid default gen_random_uuid() primary key,
  registration_id uuid references public.registrations(id) not null,
  type text not null, -- e.g., "waiver", "medical"
  file_url text not null,
  uploaded_at timestamptz default now()
);
alter table public.registration_docs enable row level security;

-- 11. Notifications
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;

-- 12. Audit Logs
create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id),
  action text not null,
  table_name text not null,
  record_id uuid not null,
  details jsonb,
  created_at timestamptz default now()
);
alter table public.audit_logs enable row level security;

-- RLS Policies (Basic Template)
-- We use 'do' blocks or simple 'create policy if not exists' logic
-- NOTE: Postgres doesn't support 'create policy if not exists' natively in all versions easily without a do block.
-- The simplest way to avoid errors is to drop the policy if it exists and recreate it, or wrap in a do block.

do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can view own data' and tablename = 'users') then
    create policy "Users can view own data" on public.users for select using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Users can update own data' and tablename = 'users') then
    create policy "Users can update own data" on public.users for update using (auth.uid() = id);
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Public can view published events' and tablename = 'events') then
    create policy "Public can view published events" on public.events for select using (status = 'published');
  end if;

  if not exists (select 1 from pg_policies where policyname = 'Organisers can manage own events' and tablename = 'events') then
    create policy "Organisers can manage own events" on public.events for all using (auth.uid() = organiser_id);
  end if;
end
$$;
