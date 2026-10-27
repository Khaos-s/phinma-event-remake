-- Synthetic identities and events exist only inside this rolled-back transaction.
begin;
do $$
declare
  administrator uuid := gen_random_uuid(); organizer uuid := gen_random_uuid(); member uuid := gen_random_uuid();
  publisher uuid; other_publisher uuid; record_id uuid; own_event uuid; actor uuid; account_id uuid;
  version timestamptz; old_version timestamptz; original_reviewer uuid; path text; changed integer;
begin
  insert into auth.users(id,aud,role,email) select id,'authenticated','authenticated',id::text||'@example.invalid'
    from unnest(array[administrator,organizer,member]) id;
  insert into public.organizations(name,department) values ('ROLLBACK admin publisher','College of Management') returning id into publisher;
  insert into public.organizations(name,department) values ('ROLLBACK other publisher','College of Management') returning id into other_publisher;
  insert into public.role_assignments(user_id,role,organization_id,course) values
    (administrator,'event_admin',null,null),(organizer,'organizer',publisher,'BSHM');

  foreach actor in array array[member,organizer] loop
    perform set_config('request.jwt.claim.sub',actor::text,true);
    execute 'set local role authenticated';
    begin perform public.admin_organizers(); raise exception 'Non-admin account read accepted'; exception when insufficient_privilege then null; end;
    begin perform public.admin_assign_organizer(member::text||'@example.invalid','Forged publisher','College of Management','BSHM'); raise exception 'Non-admin registration accepted'; exception when insufficient_privilege then null; end;
    begin perform public.admin_save_event(null,null,publisher,'Forged','Forged',actor::text||'/fake.png',now(),now()+interval '1 hour','BSHM',null); raise exception 'Non-admin creation accepted'; exception when insufficient_privilege then null; end;
    begin perform public.admin_delete_event(gen_random_uuid(),now()); raise exception 'Non-admin deletion accepted'; exception when insufficient_privilege then null; end;
    execute 'reset role';
  end loop;

  perform set_config('request.jwt.claim.sub',organizer::text,true);
  execute 'set local role authenticated';
  begin
    insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
      values(organizer,'Wrong course','Description',organizer::text||'/wrong.png',now(),now()+interval '1 hour','College of Management','BSTM');
    raise exception 'Assigned course was not enforced';
  exception when insufficient_privilege then null; end;
  insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
    values(organizer,'Own submission','Description',organizer::text||'/own.png',now(),now()+interval '1 hour','College of Management','BSHM') returning id into own_event;
  update public.events set title='Forbidden pending edit' where id=own_event;
  get diagnostics changed=row_count;
  if changed<>0 then raise exception 'Organizer edited a pending event'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub',administrator::text,true);
  execute 'set local role authenticated';
  begin perform public.admin_assign_organizer(member::text||'@example.invalid','ROLLBACK new publisher','College of Management','BSIT'); raise exception 'Mismatched course assigned'; exception when check_violation then null; end;
  account_id := public.admin_assign_organizer(member::text||'@example.invalid','ROLLBACK new publisher','College of Management','BSBA');
  if account_id<>member then raise exception 'Wrong registered account'; end if;
  if public.admin_assign_organizer(member::text||'@example.invalid','ROLLBACK new publisher','College of Management','BSBA')<>member then raise exception 'Retry is not idempotent'; end if;
  begin perform public.admin_assign_organizer(administrator::text||'@example.invalid','ROLLBACK new publisher','College of Management','BSBA'); raise exception 'Administrator role overwritten'; exception when check_violation then null; end;
  begin perform public.admin_assign_organizer(member::text||'@example.invalid','ROLLBACK other publisher','College of Management','BSBA'); raise exception 'Different assignment overwritten'; exception when check_violation then null; end;
  if (select count(*) from public.admin_organizers() where user_id in(organizer,member))<>2 then raise exception 'Registered list is incomplete'; end if;

  record_id := public.admin_save_event(null,null,publisher,'Admin event','Description',administrator::text||'/event.png',now(),now()+interval '1 hour','BSTM',2::smallint);
  select e.updated_at into old_version from public.workspace_events() e where e.id=record_id;
  if not exists(select 1 from public.workspace_events() e where e.id=record_id and e.created_by=administrator and e.status='pending') then raise exception 'Admin creation scope/state is wrong'; end if;
  perform public.approve_event(record_id);
  begin perform public.admin_save_event(record_id,old_version,publisher,'Stale','Description',administrator::text||'/event.png',now(),now()+interval '1 hour','BSTM',null); raise exception 'Stale content overwrote review'; exception when raise_exception then if sqlerrm not like 'This event changed%' then raise; end if; end;
  select e.updated_at into version from public.workspace_events() e where e.id=record_id;
  perform public.admin_save_event(record_id,version,publisher,'Published edit','Updated',administrator::text||'/event.png',now(),now()+interval '2 hours','BSBA',null);
  if not exists(select 1 from public.workspace_events() e where e.id=record_id and e.title='Published edit' and e.status='approved' and e.created_by=administrator and e.organization_id=publisher) then raise exception 'Published edit changed protected identity/state'; end if;
  select e.updated_at into version from public.workspace_events() e where e.id=record_id;
  begin perform public.admin_save_event(record_id,version,other_publisher,'Wrong publisher','Description',administrator::text||'/event.png',now(),now()+interval '1 hour','BSBA',null); raise exception 'Publisher reassigned'; exception when check_violation then null; end;
  begin perform public.admin_save_event(record_id,version,publisher,'Wrong poster owner','Description',organizer::text||'/forged.png',now(),now()+interval '1 hour','BSBA',null); raise exception 'Creator poster prefix bypassed'; exception when check_violation then null; end;
  begin perform public.admin_delete_event(record_id,old_version); raise exception 'Stale deletion accepted'; exception when raise_exception then if sqlerrm not like 'This event changed%' then raise; end if; end;
  path:=public.admin_delete_event(record_id,version);
  if path<>administrator::text||'/event.png' or exists(select 1 from public.workspace_events() e where e.id=record_id) then raise exception 'Delete did not remove the correct event'; end if;

  perform public.reject_event(own_event,'Clarify the schedule');
  select e.updated_at,e.reviewed_by into version,original_reviewer from public.workspace_events() e where e.id=own_event;
  perform public.admin_save_event(own_event,version,publisher,'Admin corrected organizer event','Updated',organizer::text||'/replacement.png',now(),now()+interval '1 hour','BSHM',null);
  if not exists(select 1 from public.workspace_events() e where e.id=own_event and e.created_by=organizer and e.reviewed_by=original_reviewer and e.status='rejected') then raise exception 'Original creator/review lost'; end if;
  execute 'reset role';

  perform set_config('request.jwt.claim.sub',organizer::text,true);
  execute 'set local role authenticated';
  begin update public.events set course='BSTM' where id=own_event; raise exception 'Direct rejected edit bypassed course'; exception when insufficient_privilege then null; end;
  begin perform public.resubmit_event(own_event,'Revision','Description',organizer::text||'/replacement.png',now(),now()+interval '1 hour','BSTM',null); raise exception 'Resubmission bypassed course'; exception when insufficient_privilege then null; end;
  perform public.resubmit_event(own_event,'Revision','Description',organizer::text||'/replacement.png',now(),now()+interval '1 hour','BSHM',null);
  begin update public.role_assignments set course='BSTM' where user_id=organizer; raise exception 'Organizer changed its assignment'; exception when insufficient_privilege then null; end;
  begin update public.events set updated_at=now() where id=own_event; raise exception 'Version forgery accepted'; exception when insufficient_privilege then null; end;
  execute 'reset role';

  -- Fresh database roles, rather than a cached UI/JWT role, authorize every operation.
  delete from public.role_assignments where user_id=administrator;
  perform set_config('request.jwt.claim.sub',administrator::text,true);
  execute 'set local role authenticated';
  begin perform public.admin_organizers(); raise exception 'Revoked administrator retained access'; exception when insufficient_privilege then null; end;
  execute 'reset role';
  if has_function_privilege('anon','public.admin_organizers()','execute')
    or has_function_privilege('anon','public.admin_assign_organizer(text,text,text,text)','execute')
    or has_function_privilege('anon','public.admin_delete_event(uuid,timestamptz)','execute') then raise exception 'Anonymous administrator RPC execution granted'; end if;
end;
$$;
rollback;
