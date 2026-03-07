-- Schema aligned with Fix.md
-- This file provides a high-level overview of the schema.
-- Please refer to supabase/migrations/ for the full, idempotent schema definitions, 
-- including all tables (categories, teams, etc.), RLS policies, and triggers.

-- 1. Reference Tables
create table if not exists public.races (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.belt_ranks (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  sort_order int default 0,
  created_at timestamptz default now()
);

create table if not exists public.genders (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.age_groups (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  min_age int,
  max_age int,
  created_at timestamptz default now()
);

create table if not exists public.weight_classes (
  id uuid default gen_random_uuid() primary key,
  age_group_id uuid references public.age_groups(id),
  gender_id uuid references public.genders(id),
  name text not null,
  min_weight_kg numeric,
  max_weight_kg numeric,
  created_at timestamptz default now()
);

create table if not exists public.divisions (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.taegeuks (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.break_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.kick_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

create table if not exists public.vr_types (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- 2. Core Tables

create table if not exists public.users (
  id uuid references auth.users not null primary key,
  email text not null,
  role text not null check (role in ('individual', 'club', 'parent', 'admin', 'staff', 'organiser', 'referee')),
  full_name text,
  phone text,
  force_password_change boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.clubs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  name text not null,
  abbreviation text,
  logo_url text,
  contact_person text,
  contact_number text,
  status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.players (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null,
  full_name text not null,
  ic_number text,
  is_foreign boolean default false,
  date_of_birth date,
  gender_id uuid references public.genders(id),
  race_id uuid references public.races(id),
  belt_rank_id uuid references public.belt_ranks(id),
  weight_kg numeric,
  height_cm numeric,
  club_id uuid references public.clubs(id),
  age_group text,
  weight_class text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organiser_profiles (
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

create table if not exists public.tournaments (
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

-- NOTE: Other tables (tournament_categories, kyorugi_categories, tournament_registrations, teams, club_payments, etc.)
-- are defined in supabase/migrations/20240523000001_core_schema.sql
