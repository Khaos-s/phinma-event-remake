-- No bytes are uploaded; Storage metadata and all Auth/event fixtures roll back.
begin;
do $$
declare
  organizer_user uuid := gen_random_uuid();
  other_user uuid := gen_random_uuid();
  admin_user uuid := gen_random_uuid();
  member_user uuid := gen_random_uuid();
  org uuid;
  proposal uuid;
  poster text := organizer_user::text || '/security-test.png';
  orphan text := organizer_user::text || '/unsubmitted.png';
  total integer;
  bad_start timestamptz;
begin
  select id into strict org from public.organizations where name='CITE Council';
  insert into auth.users (id,aud,role,email) select u,'authenticated','authenticated',u::text||'@example.invalid'
    from unnest(array[organizer_user,other_user,admin_user,member_user]) u;
  insert into public.role_assignments (user_id,role,organization_id) values
    (organizer_user,'organizer',org),(other_user,'organizer',org),(admin_user,'event_admin',null);

  perform set_config('request.jwt.claim.sub',organizer_user::text,true);
  execute 'set local role authenticated';
  insert into storage.objects(bucket_id,name) values ('event-images',poster),('event-images',orphan);
  insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
    values(organizer_user,'Private security fixture','Not a public event',poster,now(),now()+interval '1 hour','College of Information Technology','BSIT') returning id into proposal;
  if (select count(*) from public.workspace_events() where id=proposal and created_by=organizer_user)<>1 then
    raise exception 'Organizer workspace did not return own complete record';
  end if;
  begin
    perform created_by from public.events where id=proposal;
    raise exception 'Direct authenticated query disclosed account metadata';
  exception when insufficient_privilege then null; end;
  foreach bad_start in array array['-infinity'::timestamptz,'294276-01-01'::timestamptz] loop
    begin
      insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
        values(organizer_user,'Invalid schedule','Not public',poster,bad_start,'infinity','College of Information Technology','BSIT');
      raise exception 'Unsupported schedule accepted';
    exception when check_violation then null; end;
  end loop;
  begin
    insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
      values(organizer_user,'a'||repeat(' ',10000),'Description',poster,now(),now()+interval '1 hour','College of Information Technology','BSIT');
    raise exception 'Unbounded raw title accepted';
  exception when check_violation then null; end;
  begin
    insert into public.events(created_by,title,description,image_path,starts_at,ends_at,department,course)
      values(organizer_user,'Title','a'||repeat(' ',10000),poster,now(),now()+interval '1 hour','College of Information Technology','BSIT');
    raise exception 'Unbounded raw description accepted';
  exception when check_violation then null; end;
  begin
    insert into public.events(created_by,created_at,title,description,image_path,starts_at,ends_at,department,course)
      values(organizer_user,'infinity','Forged timestamp','Not public',poster,now(),now()+interval '1 hour','College of Information Technology','BSIT');
    raise exception 'Organizer overwrote database-owned timestamp';
  exception when insufficient_privilege then null; end;
  begin
    insert into storage.objects(bucket_id,name) values('event-images',other_user::text||'/forged.png');
    raise exception 'Another owner path accepted';
  exception when insufficient_privilege then null; end;
  -- The platform forbids direct SQL deletion; cleanup is tested through UI API fixtures.

  execute 'reset role';
  perform set_config('request.jwt.claim.sub',other_user::text,true);
  execute 'set local role authenticated';
  if (select count(*) from storage.objects where name=poster)<>0 then raise exception 'Private poster leaked to another organizer'; end if;
  if (select count(*) from public.workspace_events() where id=proposal)<>0 then raise exception 'Workspace leaked another organizer submission'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub',member_user::text,true);
  execute 'set local role authenticated';
  if (select count(*) from storage.objects where name=poster)<>0 then raise exception 'Private poster leaked to member'; end if;
  if (select count(*) from public.workspace_events())<>0 then raise exception 'Member accessed privileged workspace'; end if;
  execute 'reset role';
  perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role anon';
  if (select count(*) from storage.objects where name=poster)<>0 then raise exception 'Private poster leaked anonymously'; end if;
  begin
    perform * from public.workspace_events();
    raise exception 'Anonymous workspace execution allowed';
  exception when insufficient_privilege then null; end;

  execute 'reset role';
  perform set_config('request.jwt.claim.sub',admin_user::text,true);
  execute 'set local role authenticated';
  if (select count(*) from storage.objects where name=poster)<>1 then raise exception 'Administrator cannot read review poster'; end if;
  if (select count(*) from public.workspace_events() where id=proposal)<>1 then raise exception 'Administrator cannot read full proposal'; end if;
  perform public.approve_event(proposal);
  execute 'reset role';
  perform set_config('request.jwt.claim.sub','',true);
  execute 'set local role anon';
  if (select count(*) from public.events where id=proposal and status='approved')<>1 then raise exception 'Approved event unavailable'; end if;
  if (select count(*) from storage.objects where name=poster)<>1 then raise exception 'Approved image unavailable'; end if;
  begin
    perform reviewed_by from public.events where id=proposal;
    raise exception 'Reviewer account UUID exposed anonymously';
  exception when insufficient_privilege then null; end;
  execute 'reset role';
end;
$$;
rollback;
select 'PASS: schedule/text bounds, trusted timestamps, private metadata, scoped workspace and Storage ownership/privacy/publication; all fixtures rolled back' as result;
