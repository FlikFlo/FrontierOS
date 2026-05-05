-- BrewMaster Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- =====================
-- RECIPES
-- =====================
create table if not exists recipes (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  style text not null default '',
  description text,
  batch_size_l numeric(8,2) not null default 20,
  efficiency numeric(5,2) not null default 75,
  boil_time_min integer not null default 60,
  notes text,
  og_target numeric(6,4),
  fg_target numeric(6,4),
  abv_target numeric(5,2),
  ibu_target numeric(6,2),
  srm_target numeric(6,2),
  malts jsonb not null default '[]',
  hops jsonb not null default '[]',
  yeasts jsonb not null default '[]',
  adjuncts jsonb not null default '[]'
);

-- =====================
-- BREW LOGS
-- =====================
create type brew_status as enum (
  'planned', 'mashing', 'boiling', 'fermenting',
  'conditioning', 'ready', 'archived'
);

create table if not exists brew_logs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  recipe_id uuid references recipes(id) on delete set null,
  recipe_name text not null,
  batch_number text not null,
  status brew_status not null default 'planned',
  brew_date date,
  package_date date,
  batch_size_l numeric(8,2) not null default 20,
  notes text,
  og_actual numeric(6,4),
  fg_actual numeric(6,4),
  abv_actual numeric(5,2),
  efficiency_actual numeric(5,2),
  total_cost numeric(10,2),
  cost_per_liter numeric(8,2)
);

-- =====================
-- FERMENTATION LOGS
-- =====================
create type fermentation_stage as enum ('primary', 'secondary', 'conditioning');

create table if not exists fermentation_logs (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  brew_log_id uuid not null references brew_logs(id) on delete cascade,
  stage fermentation_stage not null default 'primary',
  measured_at timestamptz not null default now(),
  gravity numeric(6,4),
  temperature_c numeric(5,2),
  ph numeric(4,2),
  notes text
);

-- =====================
-- INVENTORY
-- =====================
create type ingredient_type as enum (
  'malt', 'hop', 'yeast', 'adjunct', 'chemical', 'other'
);

create table if not exists inventory (
  id uuid primary key default uuid_generate_v4(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  name text not null,
  type ingredient_type not null,
  quantity numeric(10,3) not null default 0,
  unit text not null default 'kg',
  min_stock numeric(10,3),
  cost_per_unit numeric(10,4),
  supplier text,
  notes text
);

-- =====================
-- UPDATED_AT TRIGGER
-- =====================
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger recipes_updated_at before update on recipes
  for each row execute function update_updated_at();

create trigger brew_logs_updated_at before update on brew_logs
  for each row execute function update_updated_at();

create trigger inventory_updated_at before update on inventory
  for each row execute function update_updated_at();

-- =====================
-- SEED DATA (optional)
-- =====================
insert into inventory (name, type, quantity, unit, min_stock, cost_per_unit, supplier) values
  ('Pale Ale Malt (Maris Otter)', 'malt', 25.0, 'kg', 5.0, 1.80, 'Crisp Malting'),
  ('Pilsner Malt', 'malt', 15.5, 'kg', 5.0, 1.60, 'Weyermann'),
  ('Caramel 60L', 'malt', 8.0, 'kg', 2.0, 2.20, 'Briess'),
  ('Roasted Barley', 'malt', 3.0, 'kg', 1.0, 2.50, 'Crisp Malting'),
  ('Centennial Hops', 'hop', 500, 'g', 100, 0.035, 'Yakima Chief'),
  ('Cascade Hops', 'hop', 300, 'g', 100, 0.030, 'Yakima Chief'),
  ('Citra Hops', 'hop', 200, 'g', 100, 0.055, 'Hopunion'),
  ('Saaz Hops', 'hop', 400, 'g', 100, 0.028, 'Select Botanicals'),
  ('US-05 American Ale', 'yeast', 10, 'pkg', 2, 4.50, 'Fermentis'),
  ('S-04 English Ale', 'yeast', 5, 'pkg', 2, 4.50, 'Fermentis'),
  ('Gypsum (CaSO4)', 'chemical', 500, 'g', 100, 0.008, 'BrewLab'),
  ('Lactic Acid 88%', 'chemical', 250, 'ml', 50, 0.012, 'BrewLab');
