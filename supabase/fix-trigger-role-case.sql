-- Fix: Ensure role is always lowercase to satisfy the check constraint
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, full_name, role)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    -- Force lowercase and default to 'player' if missing or invalid
    coalesce(lower(new.raw_user_meta_data->>'role'), 'player')
  );
  return new;
end;
$$;
