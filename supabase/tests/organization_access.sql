-- Database integration test: temporary identities/data exist only inside this rolled-back transaction.
begin;
do $$
declare
  council_user uuid := gen_random_uuid();
  staff_user uuid := gen_random_uuid();
  admin_user uuid := gen_random_uuid();
  member_user uuid := gen_random_uuid();
  council_org uuid;
  staff_org uuid;
  council_event uuid;
  staff_event uuid;
  row_count integer;
begin
  select id into strict council_org from public.organizations
    where name = 'CITE Council' and department = 'College of Information Technology';
  insert into public.organizations (name, department)
    values ('ROLLBACK TEST Department Staff', 'College of Management') returning id into staff_org;
  insert into auth.users (id, aud, role, email, raw_user_meta_data) values
    (council_user, 'authenticated', 'authenticated', council_user::text || '@example.invalid', '{}'::jsonb),
    (staff_user, 'authenticated', 'authenticated', staff_user::text || '@example.invalid', '{}'::jsonb),
    (admin_user, 'authenticated', 'authenticated', admin_user::text || '@example.invalid', '{}'::jsonb),
    (member_user, 'authenticated', 'authenticated', member_user::text || '@example.invalid', '{"role":"event_admin"}'::jsonb);
  insert into public.role_assignments (user_id, role, organization_id) values
    (council_user, 'cite_organizer', council_org), (staff_user, 'organizer', staff_org), (admin_user, 'event_admin', null);

  perform set_config('request.jwt.claim.sub', council_user::text, true);
  execute 'set local role authenticated';
  if not public.has_role('organizer') then raise exception 'Legacy council assignment lost access'; end if;
  insert into public.events (created_by, title, description, image_path, starts_at, ends_at, department, course)
    values (council_user, 'ROLLBACK TEST council', 'Private fixture', council_user::text || '/fixture.png', now(), now() + interval '1 hour', 'College of Information Technology', 'BSIT') returning id into council_event;
  if (select organization_id from public.events where id = council_event) <> council_org then
    raise exception 'Legacy insert did not derive trusted organization';
  end if;
  begin
    perform public.approve_event(council_event);
    raise exception 'Organizer approved own event';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', staff_user::text, true);
  execute 'set local role authenticated';
  if not public.has_role('organizer') then raise exception 'Staff organizer denied'; end if;
  if not public.has_role('cite_organizer') then raise exception 'Storage compatibility predicate denied staff'; end if;
  insert into public.events (created_by, organization_id, title, description, image_path, starts_at, ends_at, department, course)
    values (staff_user, staff_org, 'ROLLBACK TEST staff', 'Private fixture', staff_user::text || '/fixture.png', now(), now() + interval '1 hour', 'College of Management', 'BSHM') returning id into staff_event;
  select count(*) into row_count from public.events where id = council_event;
  if row_count <> 0 then raise exception 'Another organizer private event leaked'; end if;
  select count(*) into row_count from public.role_assignments where user_id = council_user;
  if row_count <> 0 then raise exception 'Another role assignment leaked'; end if;
  begin
    insert into public.events (created_by, organization_id, title, description, image_path, starts_at, ends_at, department, course)
      values (staff_user, council_org, 'Forged organization', 'Private fixture', staff_user::text || '/bad.png', now(), now() + interval '1 hour', 'College of Information Technology', 'BSIT');
    raise exception 'Cross-organization insert was accepted';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.events (created_by, title, description, image_path, starts_at, ends_at, department, course)
      values (staff_user, 'Forged department', 'Private fixture', staff_user::text || '/bad.png', now(), now() + interval '1 hour', 'College of Information Technology', 'BSIT');
    raise exception 'Cross-department insert was accepted';
  exception when foreign_key_violation then null; end;
  begin
    insert into public.events (created_by, title, description, image_path, starts_at, ends_at, department, course)
      values (staff_user, 'Wrong program', 'Private fixture', staff_user::text || '/bad.png', now(), now() + interval '1 hour', 'College of Management', 'BSIT');
    raise exception 'Invalid department/program pair was accepted';
  exception when foreign_key_violation then null; end;
  begin
    update public.events set status = 'approved' where id = staff_event;
    raise exception 'Direct organizer update was allowed';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.organizations (name, department) values ('Forged organization', 'College of Management');
    raise exception 'Browser organization creation was allowed';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', member_user::text, true);
  execute 'set local role authenticated';
  if public.has_role('event_admin') then raise exception 'Editable metadata granted administrator'; end if;
  begin
    insert into public.role_assignments (user_id, role) values (member_user, 'event_admin');
    raise exception 'Member granted self administrator';
  exception when insufficient_privilege then null; end;
  begin
    insert into public.events (created_by, title, description, image_path, starts_at, ends_at, department, course)
      values (member_user, 'Unauthorized member', 'Private fixture', member_user::text || '/bad.png', now(), now() + interval '1 hour', 'College of Management', 'BSHM');
    raise exception 'Unassigned member submitted event';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
  select count(*) into row_count from public.events where id in (council_event, staff_event);
  if row_count <> 0 then raise exception 'Pending events leaked publicly'; end if;
  begin
    perform public.approve_event(staff_event);
    raise exception 'Anonymous caller approved event';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub', admin_user::text, true);
  execute 'set local role authenticated';
  perform public.approve_event(staff_event);
  perform public.reject_event(council_event, 'Please include the complete announcement.');
  begin
    perform public.approve_event(staff_event);
    raise exception 'Repeated approval was accepted' using errcode = 'XX000';
  exception when raise_exception then null; end;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub', '', true);
  execute 'set local role anon';
  select count(*) into row_count from public.events where id = staff_event and status = 'approved';
  if row_count <> 1 then raise exception 'Approval did not publish staff event'; end if;
  select count(*) into row_count from public.events where id = council_event;
  if row_count <> 0 then raise exception 'Rejected event leaked publicly'; end if;
  execute 'reset role';
  delete from public.role_assignments where user_id = staff_user;
  perform set_config('request.jwt.claim.sub', staff_user::text, true);
  execute 'set local role authenticated';
  if public.has_role('organizer') then raise exception 'Revoked grant still authorized'; end if;
  execute 'reset role';
end;
$$;
rollback;
select 'PASS: scoped council/staff inserts, private reads, forged scope denial, member/anonymous denial, admin-only review/publication, and revocation; all fixtures rolled back' as result;
