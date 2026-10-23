-- Row policies protect submissions; column grants also keep account/review metadata private.
revoke select on public.events from anon, authenticated;
grant select (id, organization_id, title, description, image_path, starts_at,
  ends_at, department, course, target_year, status)
  on public.events to anon, authenticated;

-- Full workspace records are returned only after checking the current trusted assignment.
create function public.workspace_events()
returns setof public.events language sql stable security definer set search_path = '' as $$
  select e.* from public.events e
  where (select public.has_role('event_admin'))
    or (e.created_by = (select auth.uid()) and (select public.has_role('organizer')));
$$;
revoke all on function public.workspace_events() from public, anon;
grant execute on function public.workspace_events() to authenticated;
