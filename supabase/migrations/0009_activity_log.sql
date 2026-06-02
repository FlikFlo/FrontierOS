-- 0009_activity_log.sql
-- Activity feed / audit log: one row per create / update / delete across the
-- CRM. Written by server actions, read by everyone on the team, streamed live
-- via Realtime. Idempotent.

create table if not exists public.activity_log (
  id         uuid primary key default gen_random_uuid(),
  actor      text,
  action     text not null check (action in ('created', 'updated', 'deleted')),
  entity     text not null,
  entity_id  uuid,
  label      text,
  created_at timestamptz not null default now()
);

create index if not exists idx_activity_created on public.activity_log (created_at desc);

alter table public.activity_log enable row level security;

drop policy if exists activity_select on public.activity_log;
create policy activity_select on public.activity_log
  for select to authenticated using (true);

-- Inserts come from authenticated server actions.
drop policy if exists activity_insert on public.activity_log;
create policy activity_insert on public.activity_log
  for insert to authenticated with check (true);

-- Stream new activity to open feeds.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'activity_log'
  ) then
    alter publication supabase_realtime add table public.activity_log;
  end if;
end $$;
