-- ============================================================================
-- FrontierOS — auth profiles + role, and RLS tightened to authenticated.
-- Run after schema.sql. Idempotent.
-- ============================================================================

-- ── profiles (one row per auth user, holds the role) ────────────────────────
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text,
  full_name  text,
  role       text not null default 'sales_manager' check (role in ('owner', 'sales_manager', 'brewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_profiles_updated on public.profiles;
create trigger trg_profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile on signup. The very first user becomes the owner;
-- everyone after defaults to sales_manager (adjust per-user in the dashboard).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare first_user boolean;
begin
  select count(*) = 0 into first_user from public.profiles;
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    case when first_user then 'owner' else 'sales_manager' end
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- profiles RLS: a user may read only their own profile. Inserts happen via the
-- security-definer trigger (bypasses RLS); role changes are admin-only (no
-- self-update policy, so users can't escalate their own role).
alter table public.profiles enable row level security;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select to authenticated using (id = auth.uid());

-- ── Tighten data tables: replace the temporary anon-open policy with
--    authenticated-only access. Role-scoped row rules can layer on later. ────
do $$
declare t text;
begin
  foreach t in array array['clients','contacts','products','deals','orders','order_items'] loop
    execute format('drop policy if exists temp_anon_all on public.%I;', t);
    execute format('drop policy if exists authed_all on public.%I;', t);
    execute format(
      'create policy authed_all on public.%I for all to authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
