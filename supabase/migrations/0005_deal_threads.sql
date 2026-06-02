-- ============================================================================
-- FrontierOS — deal comments + attachments (files in Storage). Run after 0001.
-- Idempotent.
-- ============================================================================

-- ── comments ────────────────────────────────────────────────────────────────
create table if not exists public.deal_comments (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  body       text not null,
  author     text,
  created_at timestamptz not null default now()
);
create index if not exists idx_deal_comments_deal on public.deal_comments (deal_id);

alter table public.deal_comments enable row level security;
drop policy if exists authed_all on public.deal_comments;
create policy authed_all on public.deal_comments for all to authenticated using (true) with check (true);

-- ── attachments (metadata; bytes live in Storage) ──────────────────────────
create table if not exists public.deal_attachments (
  id         uuid primary key default gen_random_uuid(),
  deal_id    uuid not null references public.deals(id) on delete cascade,
  name       text not null,
  path       text not null,
  mime       text,
  size       bigint,
  created_at timestamptz not null default now()
);
create index if not exists idx_deal_attachments_deal on public.deal_attachments (deal_id);

alter table public.deal_attachments enable row level security;
drop policy if exists authed_all on public.deal_attachments;
create policy authed_all on public.deal_attachments for all to authenticated using (true) with check (true);

-- ── private storage bucket + access policy ─────────────────────────────────
insert into storage.buckets (id, name, public)
values ('deal-attachments', 'deal-attachments', false)
on conflict (id) do nothing;

drop policy if exists deal_attachments_rw on storage.objects;
create policy deal_attachments_rw on storage.objects for all to authenticated
  using (bucket_id = 'deal-attachments') with check (bucket_id = 'deal-attachments');
