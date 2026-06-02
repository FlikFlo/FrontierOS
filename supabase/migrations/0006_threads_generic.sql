-- ============================================================================
-- FrontierOS — generalize comments + attachments to any entity (deal/client/
-- order). Migrates the deal-specific tables, then drops them. Run after 0005.
-- Idempotent.
-- ============================================================================

create table if not exists public.comments (
  id         uuid primary key default gen_random_uuid(),
  entity     text not null check (entity in ('deal', 'client', 'order')),
  entity_id  uuid not null,
  body       text not null,
  author     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_comments_entity on public.comments (entity, entity_id);
alter table public.comments enable row level security;
drop policy if exists authed_all on public.comments;
create policy authed_all on public.comments for all to authenticated using (true) with check (true);

create table if not exists public.attachments (
  id         uuid primary key default gen_random_uuid(),
  entity     text not null check (entity in ('deal', 'client', 'order')),
  entity_id  uuid not null,
  name       text not null,
  path       text not null,
  mime       text,
  size       bigint,
  created_at timestamptz not null default now()
);
create index if not exists idx_attachments_entity on public.attachments (entity, entity_id);
alter table public.attachments enable row level security;
drop policy if exists authed_all on public.attachments;
create policy authed_all on public.attachments for all to authenticated using (true) with check (true);

-- migrate any existing deal-specific rows, then retire the old tables
do $$
begin
  if to_regclass('public.deal_comments') is not null then
    insert into public.comments (id, entity, entity_id, body, author, created_at)
      select id, 'deal', deal_id, body, author, created_at from public.deal_comments
      on conflict (id) do nothing;
    drop table public.deal_comments;
  end if;
  if to_regclass('public.deal_attachments') is not null then
    insert into public.attachments (id, entity, entity_id, name, path, mime, size, created_at)
      select id, 'deal', deal_id, name, path, mime, size, created_at from public.deal_attachments
      on conflict (id) do nothing;
    drop table public.deal_attachments;
  end if;
end $$;

-- generic private storage bucket
insert into storage.buckets (id, name, public)
values ('attachments', 'attachments', false)
on conflict (id) do nothing;

drop policy if exists attachments_rw on storage.objects;
create policy attachments_rw on storage.objects for all to authenticated
  using (bucket_id = 'attachments') with check (bucket_id = 'attachments');
