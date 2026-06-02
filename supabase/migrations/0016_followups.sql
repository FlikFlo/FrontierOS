-- 0016_followups.sql
-- Turn reminders into assignable follow-up tasks: who is responsible.
-- Idempotent.

alter table public.reminders
  add column if not exists assignee_id uuid references public.profiles(id) on delete set null;

create index if not exists idx_reminders_assignee on public.reminders (assignee_id);
