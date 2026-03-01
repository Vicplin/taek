-- Create races table
create table if not exists public.races (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

alter table public.races enable row level security;

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
