-- 0008_profile_admin.sql
-- Self-service profile name editing + owner-only member management.
--
-- profiles RLS only allows users to SELECT their own row and has no UPDATE
-- policy (so nobody can escalate their own role). These security-definer
-- functions provide the two sanctioned write paths, each with its own guard.
-- Idempotent.

-- Update your own display name only — never your role.
create or replace function public.update_my_profile(p_full_name text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set full_name = nullif(btrim(p_full_name), '')
  where id = auth.uid();
end;
$$;

-- Owner-only: update another member's name and role. An owner cannot change
-- their OWN role through this path (prevents accidental self-lockout / losing
-- the last owner).
create or replace function public.admin_update_member(
  p_id uuid,
  p_full_name text,
  p_role text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_user_role() <> 'owner' then
    raise exception 'not authorized';
  end if;
  if p_role not in ('owner', 'sales_manager', 'brewer') then
    raise exception 'invalid role: %', p_role;
  end if;

  update public.profiles
  set full_name = nullif(btrim(p_full_name), ''),
      role = case when p_id = auth.uid() then role else p_role end
  where id = p_id;
end;
$$;

grant execute on function public.update_my_profile(text) to authenticated;
grant execute on function public.admin_update_member(uuid, text, text) to authenticated;
