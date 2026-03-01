-- Phase 4: Frontend Alignment (Tournaments & Fighters)
-- This migration aligns the database with the latest frontend requirements.

-- 1. Create 'tournaments' table (replacing or augmenting 'events')
-- The frontend explicitly queries 'tournaments' with specific fields.
create table if not exists public.tournaments (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  date timestamptz not null,
  registration_deadline timestamptz,
  location text,
  address text,
  current_spots integer default 0,
  max_spots integer,
  status text check (status in ('upcoming', 'ongoing', 'completed', 'cancelled')) default 'upcoming',
  image text,
  categories jsonb, -- Stores array of category strings e.g. ["Poomsae", "Sparring"]
  entry_fee_min numeric,
  entry_fee_max numeric,
  organiser_id uuid references public.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tournaments enable row level security;

-- Policies for tournaments
create policy "Public can view tournaments" 
  on public.tournaments for select 
  using (true);

create policy "Organisers can manage tournaments" 
  on public.tournaments for all 
  using (auth.uid() = organiser_id);


-- 2. Create 'fighters' table
-- This allows users (parents/coaches) to manage multiple athlete profiles under one account.
-- Note: 'player_profiles' was 1:1, this is 1:N.
create table if not exists public.fighters (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null, -- The manager (parent/coach)
  full_name text not null,
  ic_number text,
  date_of_birth date,
  gender text check (gender in ('male', 'female', 'other')),
  race text,
  belt_rank text,
  weight_kg numeric,
  height_cm numeric,
  club_id uuid references public.clubs(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.fighters enable row level security;

-- Policies for fighters
create policy "Users can manage their own fighters" 
  on public.fighters for all 
  using (auth.uid() = user_id);

-- 3. Updates to 'clubs' if needed (ensure it exists and has 'is_active')
-- Frontend checks for 'is_active' column in clubs
alter table public.clubs add column if not exists is_active boolean default true;

-- 4. Create 'matches' table for brackets (Hot Brackets) if needed later
-- For now, just ensuring the core entities exist.

-- 5. Create 'tournament_registrations' table
-- This links fighters to tournaments they are registered for.
create table if not exists public.tournament_registrations (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) not null,
  fighter_id uuid references public.fighters(id) not null,
  category text, -- e.g. "Kyorugi -68kg"
  status text check (status in ('pending', 'approved', 'rejected', 'withdrawn')) default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.tournament_registrations enable row level security;

create policy "Users can view own registrations"
  on public.tournament_registrations for select
  using (
    exists (
      select 1 from public.fighters
      where fighters.id = tournament_registrations.fighter_id
      and fighters.user_id = auth.uid()
    )
  );

create policy "Users can create registrations for own fighters"
  on public.tournament_registrations for insert
  with check (
    exists (
      select 1 from public.fighters
      where fighters.id = tournament_registrations.fighter_id
      and fighters.user_id = auth.uid()
    )
  );
