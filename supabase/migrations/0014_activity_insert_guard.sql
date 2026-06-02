-- 0014_activity_insert_guard.sql
-- 0011 restricted activity_log SELECT to the owner but left INSERT open to any
-- authenticated user (incl. a no-access 'pending' account), which could forge
-- audit/feed rows via the raw API. Deny 'pending' on insert too. The 'joined'
-- entry written by claim_invite still works — that function is SECURITY DEFINER
-- and bypasses RLS. Idempotent.

drop policy if exists activity_insert on public.activity_log;
create policy activity_insert on public.activity_log
  for insert to authenticated
  with check (public.current_user_role() <> 'pending');
