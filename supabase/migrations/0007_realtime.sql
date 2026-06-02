-- 0007_realtime.sql
-- Enable Supabase Realtime for the CRM tables so lists, boards and threads
-- stay live across users. Realtime honours RLS, so each subscriber only
-- receives change events for rows they are allowed to read.
--
-- Idempotent: only adds a table to the supabase_realtime publication when it
-- isn't already a member.

do $$
declare
  t text;
  tables text[] := array[
    'clients',
    'contacts',
    'deals',
    'orders',
    'order_items',
    'products',
    'comments',
    'attachments',
    'reminders'
  ];
begin
  foreach t in array tables loop
    if exists (select 1 from pg_class c join pg_namespace n on n.oid = c.relnamespace
               where n.nspname = 'public' and c.relname = t)
       and not exists (select 1 from pg_publication_tables
                       where pubname = 'supabase_realtime'
                         and schemaname = 'public'
                         and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I;', t);
    end if;
  end loop;
end $$;

-- Include full row data on UPDATE/DELETE events (so payloads carry old values).
alter table public.clients     replica identity full;
alter table public.contacts    replica identity full;
alter table public.deals       replica identity full;
alter table public.orders      replica identity full;
alter table public.order_items replica identity full;
alter table public.products    replica identity full;
alter table public.comments    replica identity full;
alter table public.attachments replica identity full;
alter table public.reminders   replica identity full;
