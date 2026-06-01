-- ============================================================================
-- FrontierOS CRM — initial schema
-- Single-tenant, generic B2B sales CRM. No org_id (one workspace); auth lands
-- later. Apply in the Supabase SQL editor or via `supabase db` / migrations.
--
-- ⚠️  RLS is enabled now with TEMPORARY permissive policies so the anon key can
--     read/write before auth exists. These MUST be replaced with auth-based
--     policies (auth.uid()) when authentication is wired. See the RLS block.
-- ============================================================================

create extension if not exists pgcrypto;

-- Keep updated_at fresh on every UPDATE.
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── clients (companies / accounts) ─────────────────────────────────────────
create table if not exists public.clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  industry    text,
  website     text,
  email       text,
  phone       text,
  address     text,
  status      text not null default 'lead' check (status in ('lead', 'active', 'inactive')),
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── contacts (people at a client) ──────────────────────────────────────────
create table if not exists public.contacts (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients(id) on delete cascade,
  first_name  text not null,
  last_name   text,
  title       text,
  email       text,
  phone       text,
  is_primary  boolean not null default false,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── products (catalog) ─────────────────────────────────────────────────────
create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  sku         text unique,
  name        text not null,
  description text,
  price       numeric(12, 2) not null default 0,
  currency    text not null default 'MAD',
  unit        text not null default 'pcs',
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- ── deals (sales pipeline) ─────────────────────────────────────────────────
create table if not exists public.deals (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  client_id           uuid references public.clients(id) on delete set null,
  contact_id          uuid references public.contacts(id) on delete set null,
  stage               text not null default 'lead'
                        check (stage in ('lead', 'qualified', 'proposal', 'negotiation', 'won', 'lost')),
  amount              numeric(12, 2) not null default 0,
  currency            text not null default 'MAD',
  probability         int not null default 0 check (probability between 0 and 100),
  expected_close_date date,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── orders ─────────────────────────────────────────────────────────────────
create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  order_number  text unique not null,
  client_id     uuid references public.clients(id) on delete set null,
  status        text not null default 'draft'
                  check (status in ('draft', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  order_date    date not null default current_date,
  currency      text not null default 'MAD',
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ── order_items (lines on an order) ────────────────────────────────────────
create table if not exists public.order_items (
  id          uuid primary key default gen_random_uuid(),
  order_id    uuid not null references public.orders(id) on delete cascade,
  product_id  uuid references public.products(id) on delete set null,
  description text,
  quantity    numeric(12, 2) not null default 1,
  unit_price  numeric(12, 2) not null default 0,
  created_at  timestamptz not null default now()
);

-- ── indexes on foreign keys / hot filters ──────────────────────────────────
create index if not exists idx_contacts_client     on public.contacts (client_id);
create index if not exists idx_deals_client         on public.deals (client_id);
create index if not exists idx_deals_stage          on public.deals (stage);
create index if not exists idx_orders_client        on public.orders (client_id);
create index if not exists idx_order_items_order    on public.order_items (order_id);
create index if not exists idx_order_items_product  on public.order_items (product_id);

-- ── updated_at triggers (drop-then-create so the script is re-runnable) ─────
do $$
declare t text;
begin
  foreach t in array array['clients','contacts','products','deals','orders'] loop
    execute format('drop trigger if exists trg_%s_updated on public.%I;', t, t);
    execute format(
      'create trigger trg_%s_updated before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- ── RLS — TEMPORARY pre-auth policies ──────────────────────────────────────
-- Every table has RLS on. Until auth exists, a permissive policy lets the anon
-- key operate so we can seed + view data. REPLACE each `using (true)` policy
-- with `using (auth.role() = 'authenticated')` (or tenant/owner checks) the
-- moment Supabase Auth is wired.
do $$
declare t text;
begin
  foreach t in array array['clients','contacts','products','deals','orders','order_items'] loop
    execute format('alter table public.%I enable row level security;', t);
    execute format('drop policy if exists temp_anon_all on public.%I;', t);
    execute format(
      'create policy temp_anon_all on public.%I for all to anon, authenticated using (true) with check (true);',
      t
    );
  end loop;
end $$;
