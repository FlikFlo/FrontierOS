-- 0019_remove_member.sql
-- Owner-only: remove a team member. Deletes their profile row, which revokes all
-- access (data-table RLS requires current_user_role() <> 'pending'; with no
-- profile that resolves to NULL → denied, and the proxy routes them to
-- /no-access). Their owned deals/clients fall back to unassigned via the
-- owner_id ON DELETE SET NULL foreign keys. An owner cannot remove themselves
-- (prevents losing the last owner / self-lockout). Idempotent.
--
-- Note: the underlying auth.users record is NOT deleted (that needs the admin
-- API / service role). The person simply has no access and is gone from the
-- team list. Purge the auth user from the Supabase dashboard if truly needed.

create or replace function public.admin_remove_member(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'owner' then
    raise exception 'not authorized';
  end if;
  if p_id = auth.uid() then
    raise exception 'cannot remove yourself';
  end if;
  delete from public.profiles where id = p_id;
end;
$$;

grant execute on function public.admin_remove_member(uuid) to authenticated;
