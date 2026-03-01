-- Phase 2 — Core Profiles schema updates

alter table public.player_profiles
  add column if not exists ic_number text,
  add column if not exists nationality text,
  add column if not exists phone text,
  add column if not exists belt_rank text,
  add column if not exists state text,
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text,
  add column if not exists avatar_url text;

alter table public.coach_profiles
  add column if not exists licence_no text,
  add column if not exists belt_rank text,
  add column if not exists affiliated_club_id uuid references public.clubs(id),
  add column if not exists state text,
  add column if not exists phone text,
  add column if not exists avatar_url text,
  add column if not exists verified boolean not null default false;

create table if not exists public.organiser_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) not null unique,
  org_name text not null,
  logo_url text,
  contact_name text,
  contact_email text,
  contact_phone text,
  state text,
  verification_status text check (verification_status in ('pending', 'verified', 'rejected')) not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table public.organiser_profiles enable row level security;

create table if not exists public.coach_roster (
  id uuid default gen_random_uuid() primary key,
  coach_user_id uuid references public.users(id) not null,
  player_user_id uuid references public.users(id) not null,
  status text check (status in ('pending', 'accepted', 'removed')) not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (coach_user_id, player_user_id)
);
alter table public.coach_roster enable row level security;

create table if not exists public.weight_history (
  id uuid default gen_random_uuid() primary key,
  player_id uuid references public.player_profiles(id) not null,
  weight_kg numeric not null,
  recorded_at timestamptz default now(),
  created_at timestamptz default now()
);
alter table public.weight_history enable row level security;
