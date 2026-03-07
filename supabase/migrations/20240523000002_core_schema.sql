-- Drop obsolete tables
DROP TABLE IF EXISTS public.fighters CASCADE;
DROP TABLE IF EXISTS public.player_profiles CASCADE;
DROP TABLE IF EXISTS public.coach_profiles CASCADE;
DROP TABLE IF EXISTS public.events CASCADE;
DROP TABLE IF EXISTS public.event_categories CASCADE;
DROP TABLE IF EXISTS public.registrations CASCADE;
DROP TABLE IF EXISTS public.registration_docs CASCADE;
DROP TABLE IF EXISTS public.belt_history CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;

-- 1. Users (Extend existing or create)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  role text not null check (role in ('individual', 'club', 'parent', 'admin', 'organiser')),
  full_name text,
  phone text,
  force_password_change boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure columns exist if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'force_password_change') THEN
    ALTER TABLE public.users ADD COLUMN force_password_change boolean default false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;
END $$;

-- Update role check constraint safely
DO $$
BEGIN
  ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
  ALTER TABLE public.users ADD CONSTRAINT users_role_check CHECK (role IN ('individual', 'club', 'parent', 'admin', 'organiser'));
EXCEPTION
  WHEN OTHERS THEN RAISE NOTICE 'Could not update role check constraint: %', SQLERRM;
END $$;

-- RLS for users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.users;
CREATE POLICY "Public profiles are viewable by everyone" ON public.users FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile" ON public.users FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);

-- 2. Clubs
CREATE TABLE IF NOT EXISTS public.clubs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null, -- The club owner/manager
  name text not null,
  contact_email text,
  contact_phone text,
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure columns exist if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'contact_email') THEN
    ALTER TABLE public.clubs ADD COLUMN contact_email text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'contact_phone') THEN
    ALTER TABLE public.clubs ADD COLUMN contact_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'is_active') THEN
    ALTER TABLE public.clubs ADD COLUMN is_active boolean default true;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'user_id') THEN
    ALTER TABLE public.clubs ADD COLUMN user_id uuid references public.users(id);
  END IF;
  -- Remove obsolete columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'abbreviation') THEN
    ALTER TABLE public.clubs DROP COLUMN abbreviation;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'logo_url') THEN
    ALTER TABLE public.clubs DROP COLUMN logo_url;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'contact_person') THEN
    ALTER TABLE public.clubs DROP COLUMN contact_person;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'contact_number') THEN
    ALTER TABLE public.clubs DROP COLUMN contact_number;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'clubs' AND column_name = 'status') THEN
    ALTER TABLE public.clubs DROP COLUMN status;
  END IF;
END $$;

-- RLS for clubs
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view approved clubs" ON public.clubs;
DROP POLICY IF EXISTS "Public view clubs" ON public.clubs;
CREATE POLICY "Public view clubs" ON public.clubs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Clubs can view own" ON public.clubs;
CREATE POLICY "Clubs can view own" ON public.clubs FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Clubs can update own" ON public.clubs;
CREATE POLICY "Clubs can update own" ON public.clubs FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Clubs can insert own" ON public.clubs;
CREATE POLICY "Clubs can insert own" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Players (Replaces fighters)
CREATE TABLE IF NOT EXISTS public.players (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null, -- Parent or Individual user
  full_name text not null,
  ic_number text,
  is_foreign boolean default false,
  date_of_birth date,
  gender_id uuid references public.genders(id),
  race_id uuid references public.races(id),
  belt_rank_id uuid references public.belt_ranks(id),
  weight_kg numeric,
  height_cm numeric,
  club_id uuid references public.clubs(id), -- Optional, can be independent
  age_group text, -- Cached/Calculated
  weight_class text, -- Cached/Calculated
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Ensure user_id column exists if table already existed
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'players' AND column_name = 'user_id') THEN
    ALTER TABLE public.players ADD COLUMN user_id uuid references public.users(id);
  END IF;
END $$;

-- RLS for players
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view players" ON public.players;
CREATE POLICY "Public view players" ON public.players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own players" ON public.players;
CREATE POLICY "Users manage own players" ON public.players FOR ALL USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Clubs manage their players" ON public.players;
CREATE POLICY "Clubs manage their players" ON public.players FOR ALL USING (club_id in (select id from public.clubs where user_id = auth.uid()));

-- 4. Organiser Profiles (NEW)
CREATE TABLE IF NOT EXISTS public.organiser_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  org_name text not null,
  contact_name text,
  contact_email text,
  contact_phone text,
  logo_url text,
  state text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

ALTER TABLE public.organiser_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view organiser profiles" ON public.organiser_profiles;
CREATE POLICY "Public view organiser profiles" ON public.organiser_profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Organisers manage own profile" ON public.organiser_profiles;
CREATE POLICY "Organisers manage own profile" ON public.organiser_profiles FOR ALL USING (auth.uid() = user_id);

-- 5. Tournaments
CREATE TABLE IF NOT EXISTS public.tournaments (
  id uuid default gen_random_uuid() primary key,
  organiser_id uuid references public.users(id),
  title text not null,
  description text,
  image text,
  location text,
  start_date timestamptz,
  end_date timestamptz,
  registration_open timestamptz,
  registration_close timestamptz,
  max_participants integer,
  status text default 'upcoming' check (status in ('upcoming', 'registration_open', 'registration_close', 'full', 'ongoing', 'completed', 'cancelled')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Helper to handle column renames/additions for tournaments if it exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'organiser_id') THEN
     ALTER TABLE public.tournaments ADD COLUMN organiser_id uuid references public.users(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournaments' AND column_name = 'title') THEN
     ALTER TABLE public.tournaments ADD COLUMN title text;
  END IF;
END $$;

-- RLS for tournaments
ALTER TABLE public.tournaments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view tournaments" ON public.tournaments;
CREATE POLICY "Public view tournaments" ON public.tournaments FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage tournaments" ON public.tournaments;
CREATE POLICY "Admins manage tournaments" ON public.tournaments FOR ALL USING (exists (select 1 from public.users where id = auth.uid() and role in ('admin', 'organiser')));

-- 6. Tournament Categories (Refactored - Base Table)
-- Drop old table if it has the old structure (e.g. has weight_class_id) to avoid conflicts
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_categories' AND column_name = 'weight_class_id') THEN
    DROP TABLE public.tournament_categories CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.tournament_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) not null,
  type text not null check (type in ('kyorugi', 'poomsae', 'breaking', 'speed_kicking', 'vr')),
  created_at timestamptz default now()
);

ALTER TABLE public.tournament_categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view categories" ON public.tournament_categories;
CREATE POLICY "Public view categories" ON public.tournament_categories FOR SELECT USING (true);

-- 7. Competition Category Tables (Sub-tables)

-- Kyorugi
CREATE TABLE IF NOT EXISTS public.kyorugi_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_category_id uuid references public.tournament_categories(id) not null, -- Removed unique
  name text not null,
  gender_id uuid references public.genders(id),
  age_group_id uuid references public.age_groups(id),
  belt_rank_from_id uuid references public.belt_ranks(id),
  belt_rank_to_id uuid references public.belt_ranks(id),
  division_id uuid references public.divisions(id),
  is_team boolean default false,
  team_size integer,
  fee_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Kyorugi Weight Classes Junction
CREATE TABLE IF NOT EXISTS public.kyorugi_category_weight_classes (
  kyorugi_category_id uuid references public.kyorugi_categories(id) on delete cascade,
  weight_class_id uuid references public.weight_classes(id) on delete cascade,
  primary key (kyorugi_category_id, weight_class_id)
);

-- Poomsae
CREATE TABLE IF NOT EXISTS public.poomsae_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_category_id uuid references public.tournament_categories(id) not null, -- Removed unique
  name text not null,
  gender_id uuid references public.genders(id),
  age_group_id uuid references public.age_groups(id),
  belt_rank_from_id uuid references public.belt_ranks(id),
  belt_rank_to_id uuid references public.belt_ranks(id),
  is_team boolean default false,
  team_size integer,
  fee_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Poomsae Taegeuks Junction
CREATE TABLE IF NOT EXISTS public.poomsae_category_taegeuks (
  poomsae_category_id uuid references public.poomsae_categories(id) on delete cascade,
  taegeuk_id uuid references public.taegeuks(id) on delete cascade,
  primary key (poomsae_category_id, taegeuk_id)
);

-- Breaking
CREATE TABLE IF NOT EXISTS public.breaking_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_category_id uuid references public.tournament_categories(id) not null, -- Removed unique
  name text not null,
  gender_id uuid references public.genders(id),
  age_group_id uuid references public.age_groups(id),
  belt_rank_from_id uuid references public.belt_ranks(id),
  belt_rank_to_id uuid references public.belt_ranks(id),
  break_type_id uuid references public.break_types(id),
  is_team boolean default false,
  team_size integer,
  fee_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- Breaking Weight Classes Junction (if needed, Fix.md says yes)
CREATE TABLE IF NOT EXISTS public.breaking_category_weight_classes (
  breaking_category_id uuid references public.breaking_categories(id) on delete cascade,
  weight_class_id uuid references public.weight_classes(id) on delete cascade,
  primary key (breaking_category_id, weight_class_id)
);

-- Speed Kicking
CREATE TABLE IF NOT EXISTS public.speed_kicking_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_category_id uuid references public.tournament_categories(id) not null, -- Removed unique
  name text not null,
  gender_id uuid references public.genders(id),
  age_group_id uuid references public.age_groups(id),
  belt_rank_from_id uuid references public.belt_ranks(id),
  belt_rank_to_id uuid references public.belt_ranks(id),
  kick_type_id uuid references public.kick_types(id),
  is_team boolean default false,
  team_size integer,
  fee_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- VR
CREATE TABLE IF NOT EXISTS public.vr_categories (
  id uuid default gen_random_uuid() primary key,
  tournament_category_id uuid references public.tournament_categories(id) not null, -- Removed unique
  name text not null,
  gender_id uuid references public.genders(id),
  age_group_id uuid references public.age_groups(id),
  belt_rank_from_id uuid references public.belt_ranks(id),
  belt_rank_to_id uuid references public.belt_ranks(id),
  vr_type_id uuid references public.vr_types(id),
  is_team boolean default false,
  team_size integer,
  fee_amount numeric default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS for all category tables (Generic)
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['kyorugi_categories', 'poomsae_categories', 'breaking_categories', 'speed_kicking_categories', 'vr_categories']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Public view %I" ON public.%I', t, t);
    EXECUTE format('CREATE POLICY "Public view %I" ON public.%I FOR SELECT USING (true)', t, t);
  END LOOP;
END $$;

-- 8. Tournament Registrations
CREATE TABLE IF NOT EXISTS public.tournament_registrations (
  id uuid default gen_random_uuid() primary key,
  tournament_id uuid references public.tournaments(id) not null,
  player_id uuid references public.players(id) not null,
  competition_category_id uuid not null, -- Removed FK
  competition_type text not null check (competition_type in ('kyorugi', 'poomsae', 'breaking', 'speed_kicking', 'vr')),
  club_id uuid references public.clubs(id), -- Snapshot of club at registration time
  status text default 'pending' check (status in ('pending', 'club_verified', 'rejected', 'payment_submitted', 'approved')),
  rejection_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tournament_registrations' AND column_name = 'club_id') THEN
    ALTER TABLE public.tournament_registrations ADD COLUMN club_id uuid references public.clubs(id);
  END IF;
  -- Ensure constraint is removed if it existed
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tournament_registrations_competition_category_id_fkey') THEN
    ALTER TABLE public.tournament_registrations DROP CONSTRAINT tournament_registrations_competition_category_id_fkey;
  END IF;
END $$;

-- RLS
ALTER TABLE public.tournament_registrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view registrations" ON public.tournament_registrations;
CREATE POLICY "Public view registrations" ON public.tournament_registrations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users manage own registrations" ON public.tournament_registrations;
CREATE POLICY "Users manage own registrations" ON public.tournament_registrations FOR ALL USING (
  exists (select 1 from public.players where players.id = tournament_registrations.player_id and players.user_id = auth.uid())
);
DROP POLICY IF EXISTS "Clubs manage own registrations" ON public.tournament_registrations;
CREATE POLICY "Clubs manage own registrations" ON public.tournament_registrations FOR ALL USING (
  exists (select 1 from public.clubs where clubs.id = tournament_registrations.club_id and clubs.user_id = auth.uid())
);

-- 9. Teams
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id),
  tournament_id uuid references public.tournaments(id),
  competition_category_id uuid references public.tournament_categories(id),
  competition_type text,
  team_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
-- RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view teams" ON public.teams;
CREATE POLICY "Public view teams" ON public.teams FOR SELECT USING (true);
DROP POLICY IF EXISTS "Clubs manage teams" ON public.teams;
CREATE POLICY "Clubs manage teams" ON public.teams FOR ALL USING (club_id in (select id from public.clubs where user_id = auth.uid()));

-- 10. Team Members
CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid default gen_random_uuid() primary key,
  team_id uuid references public.teams(id) on delete cascade,
  registration_id uuid references public.tournament_registrations(id) on delete cascade,
  created_at timestamptz default now()
);
-- RLS
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public view team members" ON public.team_members;
CREATE POLICY "Public view team members" ON public.team_members FOR SELECT USING (true);
DROP POLICY IF EXISTS "Clubs manage team members" ON public.team_members;
CREATE POLICY "Clubs manage team members" ON public.team_members FOR ALL USING (
  exists (select 1 from public.teams where teams.id = team_members.team_id and teams.club_id in (select id from public.clubs where user_id = auth.uid()))
);

-- 11. Club Payments (NEW from Fix.md)
CREATE TABLE IF NOT EXISTS public.club_payments (
  id uuid default gen_random_uuid() primary key,
  club_id uuid references public.clubs(id),
  tournament_id uuid references public.tournaments(id),
  receipt_url text,
  total_amount numeric,
  uploaded_at timestamptz default now(),
  created_at timestamptz default now()
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'club_payments' AND column_name = 'status') THEN
    ALTER TABLE public.club_payments DROP COLUMN status;
  END IF;
END $$;
-- RLS for payments
ALTER TABLE public.club_payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Clubs manage own payments" ON public.club_payments;
CREATE POLICY "Clubs manage own payments" ON public.club_payments FOR ALL USING (
  exists (select 1 from public.clubs where clubs.id = club_payments.club_id and clubs.user_id = auth.uid())
);
