-- Create races table
create table if not exists public.races (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.races enable row level security;

drop policy if exists "Public can view races" on public.races;
create policy "Public can view races" 
  on public.races for select 
  using (true);

-- Populate races
insert into public.races (name) values
('Malay'), ('Chinese'), ('Indian'), ('Others')
on conflict (name) do nothing;

-- Create belt_ranks table
create table if not exists public.belt_ranks (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table public.belt_ranks enable row level security;

drop policy if exists "Public can view belt_ranks" on public.belt_ranks;
create policy "Public can view belt_ranks" 
  on public.belt_ranks for select 
  using (true);

-- Populate belt_ranks
insert into public.belt_ranks (name, sort_order) values
('White', 1),
('Yellow 1', 2),
('Yellow 2', 3),
('Green 1', 4),
('Green 2', 5),
('Blue 1', 6),
('Blue 2', 7),
('Red 1', 8),
('Red 2', 9),
('Black 1', 10),
('Black 2', 11),
('Black 3', 12)
on conflict (name) do nothing;

-- Create genders table (moved here for consolidation, though originally in 000001)
create table if not exists public.genders (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.genders enable row level security;

drop policy if exists "Public can view genders" on public.genders;
create policy "Public can view genders" 
  on public.genders for select 
  using (true);

insert into public.genders (name) values
('Male'), ('Female')
on conflict (name) do nothing;

-- Create age_groups table
create table if not exists public.age_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique, -- Super Cadet, Cadet, Junior, Senior
  min_age int,
  max_age int,
  created_at timestamptz default now()
);

alter table public.age_groups enable row level security;

drop policy if exists "Public can view age_groups" on public.age_groups;
create policy "Public can view age_groups" 
  on public.age_groups for select 
  using (true);

insert into public.age_groups (name, min_age, max_age) values
('Super Cadet', 9, 11),
('Cadet', 12, 14),
('Junior', 15, 17),
('Senior', 18, 99)
on conflict (name) do update set min_age = excluded.min_age, max_age = excluded.max_age;

-- Create weight_classes table
-- Drop old table if it has category_id (from old schema)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'category_id') THEN
        DROP TABLE public.weight_classes CASCADE;
    END IF;
END $$;

create table if not exists public.weight_classes (
  id uuid default gen_random_uuid() primary key,
  age_group_id uuid references public.age_groups(id),
  gender_id uuid references public.genders(id),
  name text not null,
  min_weight_kg numeric, -- inclusive
  max_weight_kg numeric, -- inclusive (or < depending on logic, Fix.md uses < mostly)
  -- Fix.md uses <= for Fin, < for others, > for Heavy.
  -- We store min/max inclusive.
  created_at timestamptz default now()
);

DO $$
BEGIN
    -- Remove legacy gender column if it exists (conflicts with new gender_id)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'gender') THEN
        ALTER TABLE public.weight_classes DROP COLUMN gender;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'gender_id') THEN
        ALTER TABLE public.weight_classes ADD COLUMN gender_id uuid references public.genders(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'age_group_id') THEN
        ALTER TABLE public.weight_classes ADD COLUMN age_group_id uuid references public.age_groups(id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'min_weight_kg') THEN
        ALTER TABLE public.weight_classes ADD COLUMN min_weight_kg numeric;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'weight_classes' AND column_name = 'max_weight_kg') THEN
        ALTER TABLE public.weight_classes ADD COLUMN max_weight_kg numeric;
    END IF;
END $$;

alter table public.weight_classes enable row level security;

drop policy if exists "Public can view weight_classes" on public.weight_classes;
create policy "Public can view weight_classes" 
  on public.weight_classes for select 
  using (true);

-- We need a function or DO block to insert these because we need to look up IDs.
DO $$
DECLARE
  super_cadet_id uuid;
  cadet_id uuid;
  junior_id uuid;
  senior_id uuid;
  male_id uuid;
  female_id uuid;
BEGIN
  select id into super_cadet_id from public.age_groups where name = 'Super Cadet';
  select id into cadet_id from public.age_groups where name = 'Cadet';
  select id into junior_id from public.age_groups where name = 'Junior';
  select id into senior_id from public.age_groups where name = 'Senior';
  
  select id into male_id from public.genders where name = 'Male';
  select id into female_id from public.genders where name = 'Female';

  -- Clear existing data to avoid duplicates and ensure clean state
  TRUNCATE TABLE public.weight_classes CASCADE;

  -- SUPER CADET MALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (super_cadet_id, male_id, 'Fin (≤20kg)', 0, 20),
  (super_cadet_id, male_id, 'Fly (20.1-23kg)', 20.1, 23),
  (super_cadet_id, male_id, 'Bantam (23.1-26kg)', 23.1, 26),
  (super_cadet_id, male_id, 'Feather (26.1-29kg)', 26.1, 29),
  (super_cadet_id, male_id, 'Light (29.1-32kg)', 29.1, 32),
  (super_cadet_id, male_id, 'Welter (32.1-36kg)', 32.1, 36),
  (super_cadet_id, male_id, 'Middle (36.1-40kg)', 36.1, 40),
  (super_cadet_id, male_id, 'Heavy (>40kg)', 40.1, 999);

  -- SUPER CADET FEMALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (super_cadet_id, female_id, 'Fin (≤18kg)', 0, 18),
  (super_cadet_id, female_id, 'Fly (18.1-21kg)', 18.1, 21),
  (super_cadet_id, female_id, 'Bantam (21.1-24kg)', 21.1, 24),
  (super_cadet_id, female_id, 'Feather (24.1-27kg)', 24.1, 27),
  (super_cadet_id, female_id, 'Light (27.1-30kg)', 27.1, 30),
  (super_cadet_id, female_id, 'Welter (30.1-34kg)', 30.1, 34),
  (super_cadet_id, female_id, 'Middle (34.1-38kg)', 34.1, 38),
  (super_cadet_id, female_id, 'Heavy (>38kg)', 38.1, 999);

  -- CADET MALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (cadet_id, male_id, 'Fin (≤33kg)', 0, 33),
  (cadet_id, male_id, 'Fly (33.1-37kg)', 33.1, 37),
  (cadet_id, male_id, 'Bantam (37.1-41kg)', 37.1, 41),
  (cadet_id, male_id, 'Feather (41.1-45kg)', 41.1, 45),
  (cadet_id, male_id, 'Light (45.1-49kg)', 45.1, 49),
  (cadet_id, male_id, 'Light Welter (49.1-53kg)', 49.1, 53),
  (cadet_id, male_id, 'Welter (53.1-57kg)', 53.1, 57),
  (cadet_id, male_id, 'Light Middle (57.1-61kg)', 57.1, 61),
  (cadet_id, male_id, 'Middle (61.1-65kg)', 61.1, 65),
  (cadet_id, male_id, 'Heavy (>65kg)', 65.1, 999);

  -- CADET FEMALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (cadet_id, female_id, 'Fin (≤29kg)', 0, 29),
  (cadet_id, female_id, 'Fly (29.1-33kg)', 29.1, 33),
  (cadet_id, female_id, 'Bantam (33.1-37kg)', 33.1, 37),
  (cadet_id, female_id, 'Feather (37.1-41kg)', 37.1, 41),
  (cadet_id, female_id, 'Light (41.1-44kg)', 41.1, 44),
  (cadet_id, female_id, 'Light Welter (44.1-47kg)', 44.1, 47),
  (cadet_id, female_id, 'Welter (47.1-51kg)', 47.1, 51),
  (cadet_id, female_id, 'Light Middle (51.1-55kg)', 51.1, 55),
  (cadet_id, female_id, 'Middle (55.1-59kg)', 55.1, 59),
  (cadet_id, female_id, 'Heavy (>59kg)', 59.1, 999);

  -- JUNIOR MALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (junior_id, male_id, 'Fin (≤45kg)', 0, 45),
  (junior_id, male_id, 'Fly (45.1-48kg)', 45.1, 48),
  (junior_id, male_id, 'Bantam (48.1-51kg)', 48.1, 51),
  (junior_id, male_id, 'Feather (51.1-55kg)', 51.1, 55),
  (junior_id, male_id, 'Light (55.1-59kg)', 55.1, 59),
  (junior_id, male_id, 'Light Welter (59.1-63kg)', 59.1, 63),
  (junior_id, male_id, 'Welter (63.1-68kg)', 63.1, 68),
  (junior_id, male_id, 'Light Middle (68.1-73kg)', 68.1, 73),
  (junior_id, male_id, 'Middle (73.1-78kg)', 73.1, 78),
  (junior_id, male_id, 'Heavy (>78kg)', 78.1, 999);

  -- JUNIOR FEMALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (junior_id, female_id, 'Fin (≤42kg)', 0, 42),
  (junior_id, female_id, 'Fly (42.1-44kg)', 42.1, 44),
  (junior_id, female_id, 'Bantam (44.1-46kg)', 44.1, 46),
  (junior_id, female_id, 'Feather (46.1-49kg)', 46.1, 49),
  (junior_id, female_id, 'Light (49.1-52kg)', 49.1, 52),
  (junior_id, female_id, 'Light Welter (52.1-55kg)', 52.1, 55),
  (junior_id, female_id, 'Welter (55.1-59kg)', 55.1, 59),
  (junior_id, female_id, 'Light Middle (59.1-63kg)', 59.1, 63),
  (junior_id, female_id, 'Middle (63.1-68kg)', 63.1, 68),
  (junior_id, female_id, 'Heavy (>68kg)', 68.1, 999);

  -- SENIOR MALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (senior_id, male_id, 'Fin (≤54kg)', 0, 54),
  (senior_id, male_id, 'Fly (54.1-58kg)', 54.1, 58),
  (senior_id, male_id, 'Bantam (58.1-63kg)', 58.1, 63),
  (senior_id, male_id, 'Feather (63.1-68kg)', 63.1, 68),
  (senior_id, male_id, 'Light (68.1-74kg)', 68.1, 74),
  (senior_id, male_id, 'Welter (74.1-80kg)', 74.1, 80),
  (senior_id, male_id, 'Middle (80.1-87kg)', 80.1, 87),
  (senior_id, male_id, 'Heavy (>87kg)', 87.1, 999);

  -- SENIOR FEMALE
  insert into public.weight_classes (age_group_id, gender_id, name, min_weight_kg, max_weight_kg) values
  (senior_id, female_id, 'Fin (≤46kg)', 0, 46),
  (senior_id, female_id, 'Fly (46.1-49kg)', 46.1, 49),
  (senior_id, female_id, 'Bantam (49.1-53kg)', 49.1, 53),
  (senior_id, female_id, 'Feather (53.1-57kg)', 53.1, 57),
  (senior_id, female_id, 'Light (57.1-62kg)', 57.1, 62),
  (senior_id, female_id, 'Welter (62.1-67kg)', 62.1, 67),
  (senior_id, female_id, 'Middle (67.1-73kg)', 67.1, 73),
  (senior_id, female_id, 'Heavy (>73kg)', 73.1, 999);
END $$;

-- Create divisions table
create table if not exists public.divisions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.divisions enable row level security;
drop policy if exists "Public can view divisions" on public.divisions;
create policy "Public can view divisions" on public.divisions for select using (true);

insert into public.divisions (name) values
('Junior No Head Kick'), ('Professional Head Kick'), ('General')
on conflict (name) do nothing;

-- Create taegeuks table
create table if not exists public.taegeuks (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.taegeuks enable row level security;
drop policy if exists "Public can view taegeuks" on public.taegeuks;
create policy "Public can view taegeuks" on public.taegeuks for select using (true);

insert into public.taegeuks (name) values
('Taegeuk 1'), ('Taegeuk 2'), ('Taegeuk 3'), ('Taegeuk 4'), ('Taegeuk 5'), ('Taegeuk 6'), ('Taegeuk 7'), ('Taegeuk 8'), ('Dan 1'), ('Dan 2'), ('Dan 3'), ('General')
on conflict (name) do nothing;

-- Create break_types table
create table if not exists public.break_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.break_types enable row level security;
drop policy if exists "Public can view break_types" on public.break_types;
create policy "Public can view break_types" on public.break_types for select using (true);

insert into public.break_types (name) values
('Power Breaking'), ('Speed Breaking'), ('Artistic Breaking'), ('General')
on conflict (name) do nothing;

-- Create kick_types table
create table if not exists public.kick_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.kick_types enable row level security;
drop policy if exists "Public can view kick_types" on public.kick_types;
create policy "Public can view kick_types" on public.kick_types for select using (true);

insert into public.kick_types (name) values
('Back Kick'), ('Turning Kick'), ('General')
on conflict (name) do nothing;

-- Create vr_types table
create table if not exists public.vr_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.vr_types enable row level security;
drop policy if exists "Public can view vr_types" on public.vr_types;
create policy "Public can view vr_types" on public.vr_types for select using (true);

insert into public.vr_types (name) values
('Individual'), ('Team'), ('General')
on conflict (name) do nothing;
