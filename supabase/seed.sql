-- ============================================================================
-- FrontierOS CRM — demo seed data
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING so re-running is safe.
-- Run after schema.sql.
-- ============================================================================

-- ── clients ────────────────────────────────────────────────────────────────
insert into public.clients (id, name, industry, website, email, phone, status) values
  ('11111111-1111-1111-1111-111111111101', 'Nordwind Logistics', 'Logistics',     'nordwind.example', 'hello@nordwind.example', '+212 5 22 00 00 01', 'active'),
  ('11111111-1111-1111-1111-111111111102', 'Atlas Robotics',     'Manufacturing', 'atlas.example',    'sales@atlas.example',    '+212 5 22 00 00 02', 'active'),
  ('11111111-1111-1111-1111-111111111103', 'Verde Organics',     'Food & Bev',    'verde.example',    'contact@verde.example',  '+212 6 61 00 00 03', 'lead'),
  ('11111111-1111-1111-1111-111111111104', 'Helios Energy',      'Energy',        'helios.example',   'info@helios.example',    '+212 5 37 00 00 04', 'inactive')
on conflict (id) do nothing;

-- ── contacts ───────────────────────────────────────────────────────────────
insert into public.contacts (id, client_id, first_name, last_name, title, email, is_primary) values
  ('22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111101', 'Camille', 'Laurent', 'Head of Ops',      'camille@nordwind.example', true),
  ('22222222-2222-2222-2222-222222222202', '11111111-1111-1111-1111-111111111102', 'Marek',   'Novak',   'CTO',              'marek@atlas.example',     true),
  ('22222222-2222-2222-2222-222222222203', '11111111-1111-1111-1111-111111111103', 'Sofia',   'Marchetti','Founder',         'sofia@verde.example',     true),
  ('22222222-2222-2222-2222-222222222204', '11111111-1111-1111-1111-111111111101', 'Yann',    'Berger',  'Procurement',      'yann@nordwind.example',   false)
on conflict (id) do nothing;

-- ── products ───────────────────────────────────────────────────────────────
insert into public.products (id, sku, name, description, price, currency, unit) values
  ('33333333-3333-3333-3333-333333333301', 'FOS-CORE',  'FrontierOS Core',      'Base platform license, per seat / month', 49.00,  'MAD', 'seat'),
  ('33333333-3333-3333-3333-333333333302', 'FOS-PRO',   'FrontierOS Pro',       'Pro tier with automation, per seat / month', 99.00, 'MAD', 'seat'),
  ('33333333-3333-3333-3333-333333333303', 'FOS-ONB',   'Onboarding package',   'One-time guided onboarding', 1500.00, 'MAD', 'pcs'),
  ('33333333-3333-3333-3333-333333333304', 'FOS-SUP',   'Priority support',     'Annual priority support', 1200.00, 'MAD', 'year')
on conflict (id) do nothing;

-- ── deals ──────────────────────────────────────────────────────────────────
insert into public.deals (id, title, client_id, contact_id, stage, amount, currency, probability, expected_close_date) values
  ('44444444-4444-4444-4444-444444444401', 'Nordwind — 40 seats Pro', '11111111-1111-1111-1111-111111111101', '22222222-2222-2222-2222-222222222201', 'negotiation', 47520.00, 'MAD', 70, current_date + 21),
  ('44444444-4444-4444-4444-444444444402', 'Atlas — platform rollout', '11111111-1111-1111-1111-111111111102', '22222222-2222-2222-2222-222222222202', 'proposal',    62000.00, 'MAD', 50, current_date + 35),
  ('44444444-4444-4444-4444-444444444403', 'Verde — pilot',            '11111111-1111-1111-1111-111111111103', '22222222-2222-2222-2222-222222222203', 'qualified',    8800.00, 'MAD', 30, current_date + 14),
  ('44444444-4444-4444-4444-444444444404', 'Helios — renewal',         '11111111-1111-1111-1111-111111111104', null,                                   'won',         14400.00, 'MAD', 100, current_date - 3)
on conflict (id) do nothing;

-- ── orders ─────────────────────────────────────────────────────────────────
insert into public.orders (id, order_number, client_id, status, order_date, currency, notes) values
  ('55555555-5555-5555-5555-555555555501', 'FOS-2026-0001', '11111111-1111-1111-1111-111111111101', 'confirmed', current_date - 10, 'MAD', 'Annual contract'),
  ('55555555-5555-5555-5555-555555555502', 'FOS-2026-0002', '11111111-1111-1111-1111-111111111104', 'delivered', current_date - 30, 'MAD', 'Renewal + support')
on conflict (id) do nothing;

-- ── order_items ────────────────────────────────────────────────────────────
insert into public.order_items (id, order_id, product_id, description, quantity, unit_price) values
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333302', 'FrontierOS Pro — 40 seats', 40, 99.00),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', '33333333-3333-3333-3333-333333333303', 'Onboarding', 1, 1500.00),
  ('66666666-6666-6666-6666-666666666603', '55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333301', 'FrontierOS Core — 20 seats', 20, 49.00),
  ('66666666-6666-6666-6666-666666666604', '55555555-5555-5555-5555-555555555502', '33333333-3333-3333-3333-333333333304', 'Priority support', 1, 1200.00)
on conflict (id) do nothing;
