-- Transaction-scoped identities; no persistent events, accounts, or posters.
begin;
create function pg_temp.revise(event_id uuid, image_path text)
returns void language sql security invoker as $$
  select public.resubmit_event(event_id, 'Revised CITE event', 'Revised description', image_path,
    '2026-12-31 18:30:00+00'::timestamptz, '2026-12-31 19:30:00+00'::timestamptz, 'BSIT', 2::smallint);
$$;
grant execute on function pg_temp.revise(uuid, text) to authenticated, anon;
do $$
declare
  owner_id uuid := gen_random_uuid();
  other_id uuid := gen_random_uuid();
  member_id uuid := gen_random_uuid();
  admin_id uuid := gen_random_uuid();
  org_id uuid;
  different_org uuid;
  rejected_id uuid := gen_random_uuid();
  approved_id uuid := gen_random_uuid();
  pending_id uuid := gen_random_uuid();
  changed integer;
  column_name text;
begin
  select id into strict org_id from public.organizations where name = 'CITE Council';
  insert into public.organizations (name, department) values ('ROLLBACK revision scope', 'College of Information Technology') returning id into different_org;
  insert into auth.users (id, aud, role, email) select id, 'authenticated', 'authenticated', id::text || '@example.invalid'
    from unnest(array[owner_id, other_id, member_id, admin_id]) id;
  insert into public.role_assignments (user_id, role, organization_id) values
    (owner_id, 'cite_organizer', org_id), (other_id, 'organizer', org_id), (admin_id, 'event_admin', null);
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  insert into public.events (id, created_by, title, description, image_path, starts_at, ends_at, department, course, status, rejection_reason, reviewed_by, reviewed_at)
  select id, owner_id, 'Original', 'Original description', owner_id::text || '/' || id::text || '.png', now(), now() + interval '1 hour',
    'College of Information Technology', 'BSIT', status,
    case when status = 'rejected' then 'Fix the schedule' end,
    case when status <> 'pending' then admin_id end,
    case when status <> 'pending' then now() end
  from (values (rejected_id, 'rejected'), (approved_id, 'approved'), (pending_id, 'pending')) fixture(id, status);

  -- Same-organization ownership is still required; members and administrators cannot revise.
  foreach owner_id in array array[other_id, member_id, admin_id] loop
    perform set_config('request.jwt.claim.sub', owner_id::text, true);
    execute 'set local role authenticated';
    begin
      perform pg_temp.revise(rejected_id, owner_id::text || '/forged.png');
      raise exception 'Non-owner resubmission accepted';
    exception when insufficient_privilege then null; end;
    update public.events set title = 'Forged revision' where id = rejected_id;
    get diagnostics changed = row_count;
    if changed <> 0 then raise exception 'Non-owner direct edit accepted'; end if;
    execute 'reset role';
  end loop;
  select created_by into owner_id from public.events where id = rejected_id;
  perform set_config('request.jwt.claim.sub', owner_id::text, true);
  execute 'set local role authenticated';

  update public.events set title = 'Allowed rejected content revision' where id = rejected_id;
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Own rejected revision denied'; end if;
  update public.events set title = 'Locked' where id in (approved_id, pending_id);
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Pending or approved content changed'; end if;
  foreach column_name in array array['status', 'rejection_reason', 'reviewed_by', 'reviewed_at', 'created_by', 'organization_id', 'department', 'created_at', 'id'] loop
    if has_column_privilege('authenticated', 'public.events', column_name, 'UPDATE') then
      raise exception 'Protected column is writable: %', column_name;
    end if;
  end loop;
  begin
    update public.events set status = 'pending', rejection_reason = null, reviewed_by = null, reviewed_at = null where id = rejected_id;
    raise exception 'Organizer directly changed review state';
  exception when insufficient_privilege then null; end;
  begin
    perform pg_temp.revise(approved_id, owner_id::text || '/new.png');
    raise exception 'Approved event resubmitted';
  exception when insufficient_privilege then null; end;
  begin
    perform pg_temp.revise(pending_id, owner_id::text || '/new.png');
    raise exception 'Pending event resubmitted';
  exception when insufficient_privilege then null; end;
  begin
    perform pg_temp.revise(rejected_id, other_id::text || '/foreign.png');
    raise exception 'Foreign poster accepted';
  exception when check_violation then null; end;
  begin
    perform public.resubmit_event(rejected_id, 'Valid', 'Description', owner_id::text || '/new.png', now(), now() - interval '1 hour', 'BSIT', null);
    raise exception 'Invalid schedule accepted';
  exception when check_violation then null; end;
  begin
    perform public.resubmit_event(rejected_id, 'Valid', 'Description', owner_id::text || '/new.png', now(), now() + interval '1 hour', 'BSHM', null);
    raise exception 'Foreign course accepted';
  exception when foreign_key_violation then null; end;
  begin
    perform public.resubmit_event(rejected_id, repeat('x', 201), 'Description', owner_id::text || '/new.png', now(), now() + interval '1 hour', 'BSIT', null);
    raise exception 'Oversized input accepted';
  exception when check_violation then null; end;
  execute 'reset role';

  delete from public.role_assignments where user_id = owner_id;
  execute 'set local role authenticated';
  begin
    perform pg_temp.revise(rejected_id, owner_id::text || '/new.png');
    raise exception 'Revoked organizer resubmitted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  insert into public.role_assignments (user_id, role, organization_id) values (owner_id, 'cite_organizer', org_id);

  update public.role_assignments set organization_id = different_org where user_id = owner_id;
  execute 'set local role authenticated';
  begin
    perform pg_temp.revise(rejected_id, owner_id::text || '/new.png');
    raise exception 'Old organization event revised';
  exception when insufficient_privilege then null; end;
  update public.events set title = 'Wrong scope' where id = rejected_id;
  get diagnostics changed = row_count;
  if changed <> 0 then raise exception 'Old scope direct edit accepted'; end if;
  execute 'reset role';
  update public.role_assignments set organization_id = org_id where user_id = owner_id;
  execute 'set local role authenticated';
  perform pg_temp.revise(rejected_id, owner_id::text || '/replacement.png');
  begin
    perform pg_temp.revise(rejected_id, owner_id::text || '/duplicate.png');
    raise exception 'Repeated resubmission accepted';
  exception when insufficient_privilege then null; end;
  begin
    perform public.approve_event(rejected_id);
    raise exception 'Organizer approved resubmission';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  if not exists (select 1 from public.events where id = rejected_id and status = 'pending'
    and title = 'Revised CITE event' and rejection_reason is null and reviewed_by is null and reviewed_at is null
    and image_path = owner_id::text || '/replacement.png' and organization_id = org_id and target_year = 2) then
    raise exception 'Resubmission did not atomically replace content and clear review';
  end if;

  execute 'set local role anon';
  if exists (select 1 from public.events where id = rejected_id) then raise exception 'Resubmission public before approval'; end if;
  begin
    perform pg_temp.revise(rejected_id, 'forged.png');
    raise exception 'Anonymous resubmission accepted';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', admin_id::text, true);
  execute 'set local role authenticated';
  perform public.approve_event(rejected_id);
  execute 'reset role';
  execute 'set local role anon';
  if not exists (select 1 from public.events where id = rejected_id and status = 'approved') then
    raise exception 'Fresh administrator approval did not publish revision';
  end if;
  execute 'reset role';
end;
$$;
select 'PASS: rejected-only content edits, ownership/scope/revocation, protected review and identity columns, validation, atomic pending reset, repeated requests, and fresh approval; fixtures rolled back' as result;
rollback;
