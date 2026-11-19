-- ============================================================================
-- Optional Helper Trigger: Auto-create public.profiles row on Auth Sign Up
-- Paste in Supabase SQL Editor (safe to run multiple times)
-- ============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, phone_number, preferred_language)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'full_name', ''), split_part(new.email, '@', 1), 'Farmer'),
    nullif(new.raw_user_meta_data ->> 'phone_number', ''),
    coalesce(nullif(new.raw_user_meta_data ->> 'preferred_language', ''), 'en')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
