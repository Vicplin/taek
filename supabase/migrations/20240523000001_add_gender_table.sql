-- Create genders table
create table if not exists public.genders (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  created_at timestamptz default now()
);

-- Insert initial data
insert into public.genders (name) values
('Male'),
('Female')
on conflict (name) do nothing;

-- Enable RLS
alter table public.genders enable row level security;

-- Create policies
create policy "Allow public read access" on public.genders
  for select using (true);
