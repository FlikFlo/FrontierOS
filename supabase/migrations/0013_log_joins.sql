-- 0013_log_joins.sql
-- Record member activations in the activity feed: when someone redeems an
-- invite and joins, log a 'joined' entry (visible to the owner only).
-- Idempotent.

alter table public.activity_log drop constraint if exists activity_log_action_check;
alter table public.activity_log
  add constraint activity_log_action_check
  check (action in ('created', 'updated', 'deleted', 'joined'));

create or replace function public.claim_invite(p_token uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare v_role text; v_current text; v_email text;
begin
  select role into v_role
  from public.invitations
  where id = p_token and not revoked and (expires_at is null or expires_at > now())
  limit 1;
  if v_role is null then raise exception 'invalid_or_expired_invite'; end if;

  select role, email into v_current, v_email from public.profiles where id = auth.uid();
  if v_current is distinct from 'pending' then raise exception 'already_activated'; end if;

  update public.profiles set role = v_role where id = auth.uid();

  -- Feed: "<email> joined as <role>"
  insert into public.activity_log (actor, action, entity, entity_id, label)
  values (v_email, 'joined', v_role, auth.uid(), null);

  return v_role;
end;
$$;
