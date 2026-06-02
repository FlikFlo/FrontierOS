-- 0012_deal_currency_mad.sql
-- FrontierOS is a single-currency (MAD) business — products and orders already
-- force MAD, but the prod deals.currency column defaulted to EUR, so deals
-- created from the form inherited EUR. Fix the default and normalise rows.
-- Idempotent.

alter table public.deals alter column currency set default 'MAD';
update public.deals set currency = 'MAD' where currency is distinct from 'MAD';
