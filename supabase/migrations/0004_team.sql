-- ============================================================================
-- FrontierOS — team: let an owner read all profiles. Run after 0002. Idempotent.
-- ============================================================================

-- Returns the caller's role without triggering profiles RLS (security definer),
-- so it can be used inside a profiles policy without recursion.
create or replace function public.current_user_role()
returns text
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Owners may read every profile (the existing profiles_select_own still lets
-- non-owners read their own row).
drop policy if exists profiles_select_owner on public.profiles;
create policy profiles_select_owner on public.profiles
  for select to authenticated using (public.current_user_role() = 'owner');
