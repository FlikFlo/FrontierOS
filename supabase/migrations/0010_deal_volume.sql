-- 0010_deal_volume.sql
-- Pre-launch / FMCG volume tracking on deals: forecast in CASES (the sellable
-- unit — a case = 24 cans) plus the number of outlets/doors. Money stays as
-- `amount` (indicative early on); volume is the forward indicator for sizing
-- the first production batch. Idempotent.

alter table public.deals add column if not exists est_cases_per_month integer not null default 0;
alter table public.deals add column if not exists outlets integer not null default 0;
