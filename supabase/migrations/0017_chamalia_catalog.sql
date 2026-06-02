-- 0017_chamalia_catalog.sql
-- Seed the real Chamalia product range (Amazigh Brewing Company).
-- Four non-alcoholic styles, 330 ml cans, sold by the case. Prices left at 0
-- (MAD) to be set once pricing is confirmed. Idempotent on sku.
-- ASCII-only separators (clipboard-safe through the SQL editor).

insert into public.products (sku, name, description, price, currency, unit, active) values
  ('CHAM-PALE',  'Chamalia Pale Ale', 'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Citrus, Mandarin, Tropical, Dry. (Electric Mineral Blue)', 0, 'MAD', 'case', true),
  ('CHAM-WHEAT', 'Chamalia Wheat',    'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Soft, Breadlike, Banana, Smooth. (Muted Sand)',          0, 'MAD', 'case', true),
  ('CHAM-DARK',  'Chamalia Dark',     'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Coffee, Cacao, Caramel, Warm. (Burnt Copper)',            0, 'MAD', 'case', true),
  ('CHAM-IPA',   'Chamalia IPA',      'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Pine, Grapefruit, Tropical, Bitter. (Acid Hop Green)',    0, 'MAD', 'case', true)
on conflict (sku) do nothing;

-- Repair descriptions if a prior run stored mangled separators.
update public.products set description = 'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Citrus, Mandarin, Tropical, Dry. (Electric Mineral Blue)' where sku = 'CHAM-PALE';
update public.products set description = 'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Soft, Breadlike, Banana, Smooth. (Muted Sand)'          where sku = 'CHAM-WHEAT';
update public.products set description = 'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Coffee, Cacao, Caramel, Warm. (Burnt Copper)'            where sku = 'CHAM-DARK';
update public.products set description = 'Hopped non-alcoholic beer. 330 ml, <0.05% vol. Pine, Grapefruit, Tropical, Bitter. (Acid Hop Green)'    where sku = 'CHAM-IPA';
