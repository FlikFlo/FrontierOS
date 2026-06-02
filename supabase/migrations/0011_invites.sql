-- 0011_invites.sql
-- Invite-only registration with per-role links.
--   • new signups (after the very first owner) land as 'pending' — no access
--   • a 'pending' user redeems an invite link, which sets their real role
--   • RLS denies 'pending' on every data table (so an un-invited signup, even
--     via the raw API, sees nothing)
-- Idempotent.

-- 1) allow the 'pending' role on profiles
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles
  add constraint profiles_role_check check (role in ('owner', 'sales_manager', 'brewer', 'pending'));

-- 2) signups after the first land as 'pending' (was 'sales_manager')
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
    case when first_user then 'owner' else 'pending' end
  );
  return new;
end;
$$;

-- 3) invitations (one reusable row per role; owner-managed)
create table if not exists public.invitations (
  id         uuid primary key default gen_random_uuid(),
  role       text not null check (role in ('owner', 'sales_manager', 'brewer')),
  label      text,
  created_by uuid references auth.users(id) on delete set null,
  expires_at timestamptz,
  revoked    boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.invitations enable row level security;
drop policy if exists invitations_owner on public.invitations;
create policy invitations_owner on public.invitations
  for all to authenticated
  using (public.current_user_role() = 'owner')
  with check (public.current_user_role() = 'owner');

-- 4) read the role for a token — used by the (public) register page
create or replace function public.invite_role(p_token uuid)
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role
  from public.invitations
  where id = p_token and not revoked and (expires_at is null or expires_at > now())
  limit 1;
$$;
grant execute on function public.invite_role(uuid) to anon, authenticated;

-- 5) claim an invite — only a freshly-registered 'pending' user may; sets role
create or replace function public.claim_invite(p_token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_role text; v_current text;
begin
  select role into v_role
  from public.invitations
  where id = p_token and not revoked and (expires_at is null or expires_at > now())
  limit 1;
  if v_role is null then raise exception 'invalid_or_expired_invite'; end if;

  select role into v_current from public.profiles where id = auth.uid();
  if v_current is distinct from 'pending' then raise exception 'already_activated'; end if;

  update public.profiles set role = v_role where id = auth.uid();
  return v_role;
end;
$$;
grant execute on function public.claim_invite(uuid) to authenticated;

-- 6) deny 'pending' on every data table (app already hides them; this is the
--    authoritative gate)
do $$
declare t text;
begin
  foreach t in array array[
    'clients','contacts','products','deals','orders','order_items','comments','attachments','reminders'
  ] loop
    if exists (
      select 1 from pg_policies
      where schemaname = 'public' and tablename = t and policyname = 'authed_all'
    ) then
      execute format('drop policy authed_all on public.%I;', t);
    end if;
    execute format(
      $f$create policy authed_all on public.%I for all to authenticated
         using (public.current_user_role() <> 'pending')
         with check (public.current_user_role() <> 'pending');$f$, t);
  end loop;
end $$;

-- activity_log: owner-only read (matches the in-app restriction)
drop policy if exists activity_select on public.activity_log;
create policy activity_select on public.activity_log
  for select to authenticated
  using (public.current_user_role() = 'owner');
