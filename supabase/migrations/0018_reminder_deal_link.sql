-- 0018_reminder_deal_link.sql
-- Connect the calendar to the pipeline: a follow-up (reminder) can belong to a
-- deal. Deleting the deal removes its follow-ups. Idempotent.

alter table public.reminders
  add column if not exists deal_id uuid references public.deals(id) on delete cascade;

create index if not exists idx_reminders_deal on public.reminders (deal_id);
