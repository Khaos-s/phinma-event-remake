-- Administrator-authored announcements publish atomically; organizer review is unchanged.
create or replace function public.admin_save_event(
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
    insert into public.events(created_by, organization_id, department, title, description, image_path, starts_at, ends_at, course, target_year, status, reviewed_by, reviewed_at)
      values (auth.uid(), publisher_id, publisher_department, btrim(event_title), btrim(event_description), poster_path, event_starts_at, event_ends_at, event_course, event_year, 'approved', auth.uid(), now())
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

