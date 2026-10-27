-- Owner-authorized administrator registration and event management.
alter table public.role_assignments add column course text references public.academic_programs(code);
create index role_assignments_course on public.role_assignments(course);
alter table public.events add column updated_at timestamptz not null default clock_timestamp();

create function private.check_event_course_and_version()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare assigned_course text;
begin
  if public.has_role('organizer') then
    select r.course into assigned_course from public.role_assignments r where r.user_id = auth.uid();
    if assigned_course is not null and new.course <> assigned_course then
      raise exception 'Use your assigned course' using errcode = '42501';
    end if;
  end if;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function private.check_event_course_and_version() from public, anon, authenticated;
create trigger check_event_course_and_version before insert or update on public.events
  for each row execute function private.check_event_course_and_version();

create or replace function private.assign_event_organization()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare assigned_organization uuid;
begin
  if public.has_role('event_admin') then
    if new.organization_id is null then
      raise exception 'Choose a publisher' using errcode = '23514';
    end if;
    return new;
  end if;
  select r.organization_id into assigned_organization from public.role_assignments r
    where r.user_id = auth.uid() and r.role in ('organizer', 'cite_organizer');
  if assigned_organization is null then
    raise exception 'Organizer access is required' using errcode = '42501';
  end if;
  if new.organization_id is not null and new.organization_id <> assigned_organization then
    raise exception 'Organization does not match your assignment' using errcode = '42501';
  end if;
  new.organization_id := assigned_organization;
  return new;
end;
$$;

create function public.admin_assign_organizer(account_email text, publisher_name text, assigned_department text, assigned_course text)
returns uuid language plpgsql security definer set search_path = '' as $$
declare account_id uuid; publisher_id uuid; existing public.role_assignments;
begin
  if auth.uid() is null or not public.has_role('event_admin') then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if publisher_name is null or char_length(publisher_name) > 120 or char_length(btrim(publisher_name)) < 1
    or not exists (select 1 from public.academic_programs a where a.code = assigned_course and a.department = assigned_department) then
    raise exception 'Choose a valid publisher, department and course' using errcode = '23514';
  end if;
  select u.id into account_id from auth.users u where lower(u.email) = lower(btrim(account_email)) for update;
  if account_id is null then raise exception 'Create the account first' using errcode = '23514'; end if;
  select r.* into existing from public.role_assignments r where r.user_id = account_id for update;
  if found then
    if existing.role in ('organizer', 'cite_organizer') and existing.course = assigned_course
      and exists (select 1 from public.organizations o where o.id = existing.organization_id and o.name = btrim(publisher_name) and o.department = assigned_department) then
      return account_id;
    end if;
    raise exception 'This account already has a different access assignment' using errcode = '23514';
  end if;
  insert into public.organizations(name, department) values (btrim(publisher_name), assigned_department)
    on conflict (name, department) do update set name = excluded.name returning id into publisher_id;
  insert into public.role_assignments(user_id, role, organization_id, course)
    values (account_id, 'organizer', publisher_id, assigned_course);
  return account_id;
end;
$$;

create function public.admin_organizers()
returns table(user_id uuid, email text, organization_id uuid, organization_name text, department text, course text)
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role('event_admin') then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  return query select r.user_id, u.email::text, o.id, o.name, o.department, r.course
    from public.role_assignments r join auth.users u on u.id = r.user_id
    join public.organizations o on o.id = r.organization_id
    where r.role in ('organizer', 'cite_organizer') order by o.name, u.email;
end;
$$;

create function public.admin_save_event(
  event_id uuid, expected_updated_at timestamptz, publisher_id uuid,
  event_title text, event_description text, poster_path text,
  event_starts_at timestamptz, event_ends_at timestamptz, event_course text, event_year smallint
)
returns uuid language plpgsql security definer set search_path = '' as $$
declare publisher_department text; existing public.events; saved_id uuid;
begin
  if auth.uid() is null or not public.has_role('event_admin') then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  if char_length(event_title) > 200 or char_length(event_description) > 5000 then
    raise exception 'Event name or description is too long' using errcode = '23514';
  end if;
  if event_id is null then
    select o.department into publisher_department from public.organizations o where o.id = publisher_id;
    insert into public.events(created_by, organization_id, department, title, description, image_path, starts_at, ends_at, course, target_year)
      values (auth.uid(), publisher_id, publisher_department, btrim(event_title), btrim(event_description), poster_path, event_starts_at, event_ends_at, event_course, event_year)
      returning id into saved_id;
  else
    select e.* into existing from public.events e where e.id = event_id for update;
    if not found or expected_updated_at is null or existing.updated_at <> expected_updated_at then
      raise exception 'This event changed or was deleted. Refresh before editing again' using errcode = 'P0001';
    end if;
    if publisher_id is distinct from existing.organization_id then
      raise exception 'The original publisher must be preserved' using errcode = '23514';
    end if;
    update public.events e set title = btrim(event_title), description = btrim(event_description), image_path = poster_path,
      starts_at = event_starts_at, ends_at = event_ends_at, course = event_course, target_year = event_year
      where e.id = event_id returning e.id into saved_id;
  end if;
  return saved_id;
end;
$$;

create function public.admin_delete_event(event_id uuid, expected_updated_at timestamptz)
returns text language plpgsql security definer set search_path = '' as $$
declare removed_path text;
begin
  if auth.uid() is null or not public.has_role('event_admin') then
    raise exception 'Administrator access is required' using errcode = '42501';
  end if;
  delete from public.events e where e.id = event_id and e.updated_at = expected_updated_at returning e.image_path into removed_path;
  if not found then
    raise exception 'This event changed or was deleted. Refresh before deleting again' using errcode = 'P0001';
  end if;
  return removed_path;
end;
$$;

revoke all on function public.admin_assign_organizer(text,text,text,text), public.admin_organizers(),
  public.admin_save_event(uuid,timestamptz,uuid,text,text,text,timestamptz,timestamptz,text,smallint),
  public.admin_delete_event(uuid,timestamptz) from public, anon;
grant execute on function public.admin_assign_organizer(text,text,text,text), public.admin_organizers(),
  public.admin_save_event(uuid,timestamptz,uuid,text,text,text,timestamptz,timestamptz,text,smallint),
  public.admin_delete_event(uuid,timestamptz) to authenticated;

-- Administrator poster writes remain limited to this private event bucket.
create policy "administrators upload event posters" on storage.objects for insert to authenticated
  with check (bucket_id = 'event-images' and (select public.has_role('event_admin')));
create policy "administrators remove unreferenced posters" on storage.objects for delete to authenticated
  using (bucket_id = 'event-images' and (select public.has_role('event_admin'))
    and not exists (select 1 from public.events e where e.image_path = name));
