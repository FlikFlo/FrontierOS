-- ============================================================================
-- FrontierOS — reminders (calendar). Run after 0002. Idempotent.
-- ============================================================================

create table if not exists public.reminders (
  id         uuid primary key default gen_random_uuid(),
  title      text not null,
  due_date   date not null,
  client_id  uuid references public.clients(id) on delete set null,
  done       boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_reminders_due    on public.reminders (due_date);
create index if not exists idx_reminders_client on public.reminders (client_id);

drop trigger if exists trg_reminders_updated on public.reminders;
create trigger trg_reminders_updated before update on public.reminders
  for each row execute function public.set_updated_at();

alter table public.reminders enable row level security;
drop policy if exists authed_all on public.reminders;
create policy authed_all on public.reminders
  for all to authenticated using (true) with check (true);

-- demo reminders (relative to today)
insert into public.reminders (id, title, due_date, client_id, done) values
  ('77777777-7777-7777-7777-777777777701', 'Call Nordwind about renewal', current_date + 1, '11111111-1111-1111-1111-111111111101', false),
  ('77777777-7777-7777-7777-777777777702', 'Send Atlas the proposal',      current_date + 3, '11111111-1111-1111-1111-111111111102', false),
  ('77777777-7777-7777-7777-777777777703', 'Follow up Verde pilot',        current_date - 1, '11111111-1111-1111-1111-111111111103', true)
on conflict (id) do nothing;
