-- CITE Council pilot. Run once in the hosted Supabase project.
-- Test account email addresses are intentionally absent from this migration.

create table public.role_assignments (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('cite_organizer', 'event_admin'))
);

alter table public.role_assignments enable row level security;
revoke all on public.role_assignments from anon, authenticated;
grant select on public.role_assignments to authenticated;

create policy "users read their own role"
  on public.role_assignments for select to authenticated
  using (user_id = (select auth.uid()));

create function public.has_role(expected_role text)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.role_assignments
    where user_id = (select auth.uid()) and role = expected_role
  );
$$;

revoke all on function public.has_role(text) from public;
grant execute on function public.has_role(text) to authenticated;

create table public.events (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references auth.users(id),
  title text not null check (char_length(btrim(title)) between 1 and 200),
  description text not null check (char_length(btrim(description)) between 1 and 5000),
  image_path text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null check (ends_at > starts_at),
  department text not null default 'College of Information Technology'
    check (department = 'College of Information Technology'),
  course text not null default 'BSIT' check (course = 'BSIT'),
  target_year smallint check (target_year between 1 and 4),
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  rejection_reason text check (char_length(btrim(rejection_reason)) between 1 and 1000),
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint image_belongs_to_organizer
    check (left(image_path, char_length(created_by::text) + 1) = created_by::text || '/'
      and char_length(image_path) > char_length(created_by::text) + 1),
  constraint review_state_is_consistent check (
    (status = 'pending' and rejection_reason is null and reviewed_by is null and reviewed_at is null)
    or (status = 'approved' and rejection_reason is null and reviewed_by is not null and reviewed_at is not null)
    or (status = 'rejected' and rejection_reason is not null and reviewed_by is not null and reviewed_at is not null)
  )
);

create index events_public_schedule on public.events (starts_at, ends_at)
  where status = 'approved';
create index events_pending_created on public.events (created_at desc)
  where status = 'pending';
create index events_organizer_created on public.events (created_by, created_at desc);

alter table public.events enable row level security;
revoke all on public.events from anon, authenticated;
grant select on public.events to anon, authenticated;
grant insert on public.events to authenticated;

create policy "approved events are public"
  on public.events for select to anon, authenticated
  using (status = 'approved');

create policy "organizers read their submissions"
  on public.events for select to authenticated
  using (created_by = (select auth.uid()) and (select public.has_role('cite_organizer')));

create policy "administrators read all events"
  on public.events for select to authenticated
  using ((select public.has_role('event_admin')));

create policy "organizers submit pending events"
  on public.events for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.has_role('cite_organizer'))
    and status = 'pending'
    and rejection_reason is null
    and reviewed_by is null
    and reviewed_at is null
  );

-- Only these functions may change review state. Browser clients have no UPDATE grant.
create function public.approve_event(event_id uuid)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.has_role('event_admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  update public.events
  set status = 'approved', reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = event_id and status = 'pending';

  if not found then
    raise exception 'Event is not pending';
  end if;
end;
$$;

create function public.reject_event(event_id uuid, reason text)
returns void
language plpgsql security definer
set search_path = ''
as $$
begin
  if not public.has_role('event_admin') then
    raise exception 'Not authorized' using errcode = '42501';
  end if;
  if reason is null or char_length(btrim(reason)) not between 1 and 1000 then
    raise exception 'Give a rejection reason (1–1000 characters)';
  end if;

  update public.events
  set status = 'rejected', rejection_reason = btrim(reason),
      reviewed_by = (select auth.uid()), reviewed_at = now()
  where id = event_id and status = 'pending';

  if not found then
    raise exception 'Event is not pending';
  end if;
end;
$$;

revoke all on function public.approve_event(uuid) from public;
revoke all on function public.reject_event(uuid, text) from public;
grant execute on function public.approve_event(uuid) to authenticated;
grant execute on function public.reject_event(uuid, text) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-images', 'event-images', false, 5242880,
        array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "CITE organizers upload own event images"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_role('cite_organizer'))
  );

create policy "organizers and administrators read review images"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'event-images'
    and (
      ((storage.foldername(name))[1] = (select auth.uid())::text
        and (select public.has_role('cite_organizer')))
      or (select public.has_role('event_admin'))
    )
  );

create policy "approved event images are public"
  on storage.objects for select to anon, authenticated
  using (
    bucket_id = 'event-images'
    and exists (
      select 1 from public.events
      where image_path = name and status = 'approved'
    )
  );
