-- 0015_sales_foundation.sql
-- Sales foundation for pre-launch FMCG:
--   • clients.channel    — sales channel (HoReCa / retail / GMS / wholesale / other)
--   • clients.owner_id   — the manager who owns the account relationship
--   • deals.owner_id     — the manager who owns the deal
--   • deals.lost_reason  — why a deal was lost (feeds win/loss analytics)
--   • team_members()     — security-definer roster so any authenticated user can
--                          resolve owner names / populate the owner picker without
--                          exposing the full profiles row (no email leak beyond team)
-- Idempotent.

-- ── channel on clients ──────────────────────────────────────────────────────
alter table public.clients drop constraint if exists clients_channel_check;
alter table public.clients add column if not exists channel text;
alter table public.clients
  add constraint clients_channel_check
  check (channel is null or channel in ('horeca', 'retail', 'gms', 'wholesale', 'other'));

-- ── ownership ───────────────────────────────────────────────────────────────
alter table public.clients
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;
alter table public.deals
  add column if not exists owner_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_clients_owner   on public.clients (owner_id);
create index if not exists idx_clients_channel on public.clients (channel);
create index if not exists idx_deals_owner     on public.deals (owner_id);

-- ── lost reason on deals ────────────────────────────────────────────────────
alter table public.deals drop constraint if exists deals_lost_reason_check;
alter table public.deals add column if not exists lost_reason text;
alter table public.deals
  add constraint deals_lost_reason_check
  check (lost_reason is null or lost_reason in
    ('price', 'competitor', 'timing', 'no_interest', 'no_response', 'other'));

-- ── team roster (security definer) ──────────────────────────────────────────
-- profiles RLS only lets a user read their own row (owners read all). The owner
-- picker and "owned by X" labels need every authenticated user to resolve names,
-- so expose a minimal roster: id, name, role — excludes pending (no-access) users.
create or replace function public.team_members()
returns table (id uuid, full_name text, email text, role text)
language sql
security definer
set search_path = public
stable
as $$
  select id, full_name, email, role
  from public.profiles
  where role <> 'pending'
  order by full_name nulls last, email
$$;
grant execute on function public.team_members() to authenticated;
