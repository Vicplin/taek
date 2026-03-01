-- FIX: Resolve infinite recursion in RLS policies for 'users' table
-- The previous policy likely caused recursion when checking auth.uid() = id if the user table itself is queried during auth checks.
-- We will replace the policies with cleaner versions.

-- 1. Drop existing policies on 'users' to be safe
drop policy if exists "Users can view own data" on public.users;
drop policy if exists "Users can update own data" on public.users;

-- 2. Re-create policies with correct definitions
-- "auth.uid()" returns the ID of the currently logged-in user from the JWT.
-- We compare it directly to the 'id' column of the 'users' table.

create policy "Users can view own data" 
on public.users 
for select 
using ( auth.uid() = id );

create policy "Users can update own data" 
on public.users 
for update 
using ( auth.uid() = id );

-- 3. Allow inserting new users (needed for sign-up triggers or initial profile creation)
-- Often this is handled by Supabase Auth triggers, but if the client creates the row:
create policy "Users can insert their own profile" 
on public.users 
for insert 
with check ( auth.uid() = id );

-- 4. Service Role Bypass (implicit in Supabase, but good to be explicit if needed in some setups, though Supabase service_role key bypasses RLS automatically)
