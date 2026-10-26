-- Revisions are content-only. Review decisions and publisher identity remain database-owned.
grant update (title, description, image_path, starts_at, ends_at, course, target_year)
  on public.events to authenticated;

create policy "organizers revise own rejected events" on public.events
  for update to authenticated
  using (
    created_by = (select auth.uid()) and status = 'rejected'
    and (select public.has_role('organizer'))
    and organization_id = (select r.organization_id from public.role_assignments r where r.user_id = (select auth.uid()))
  )
  with check (
    created_by = (select auth.uid()) and status = 'rejected'
    and (select public.has_role('organizer'))
    and organization_id = (select r.organization_id from public.role_assignments r where r.user_id = (select auth.uid()))
  );

-- This is the only organizer transition: atomically replace content and request a fresh review.
create function public.resubmit_event(
  event_id uuid, revised_title text, revised_description text, revised_image_path text,
  revised_starts_at timestamptz, revised_ends_at timestamptz,
  revised_course text, revised_target_year smallint
)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.has_role('organizer') then
    raise exception 'Organizer access is required' using errcode = '42501';
  end if;

  -- Keep raw input limits before trimming; the table checks all other input boundaries.
  if char_length(revised_title) > 200 or char_length(revised_description) > 5000 then
    raise exception 'Event name or description is too long' using errcode = '23514';
  end if;

  update public.events e set
    title = btrim(revised_title), description = btrim(revised_description),
    image_path = revised_image_path, starts_at = revised_starts_at, ends_at = revised_ends_at,
    course = revised_course, target_year = revised_target_year,
    status = 'pending', rejection_reason = null, reviewed_by = null, reviewed_at = null
  where e.id = event_id and e.created_by = (select auth.uid()) and e.status = 'rejected'
    and e.organization_id = (
      select r.organization_id from public.role_assignments r
      where r.user_id = (select auth.uid()) and r.role in ('organizer', 'cite_organizer')
    );

  if not found then
    raise exception 'Only your own rejected events in your assigned organization can be resubmitted' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.resubmit_event(uuid, text, text, text, timestamptz, timestamptz, text, smallint) from public, anon;
grant execute on function public.resubmit_event(uuid, text, text, text, timestamptz, timestamptz, text, smallint) to authenticated;
