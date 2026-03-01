-- FORCE FIX: Resolve infinite recursion in RLS policies for 'users' table
-- This script explicitly drops policies by name to ensure no old recursive policies remain.

-- 1. Drop known policies (and variants)
drop policy if exists "Users can view own data" on public.users;
drop policy if exists "Users can update own data" on public.users;
drop policy if exists "Users can insert their own profile" on public.users;
drop policy if exists "Enable read access for all users" on public.users;
drop policy if exists "Enable insert for authenticated users only" on public.users;

-- 2. Create simplified, non-recursive policies
-- 'auth.uid()' is a function call and does not query the table itself.
-- 'id' is the column on the row being accessed.
-- This simple comparison is safe.

create policy "Users can view own data" 
on public.users 
for select 
using ( auth.uid() = id );

create policy "Users can update own data" 
on public.users 
for update 
using ( auth.uid() = id );

create policy "Users can insert their own profile" 
on public.users 
for insert 
with check ( auth.uid() = id );

-- 3. Verify RLS is enabled
alter table public.users enable row level security;
