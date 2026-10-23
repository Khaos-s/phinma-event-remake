-- University organizer access. Apply after 001 and 002; retain legacy CITE grants.
create table public.academic_programs (
  code text primary key,
  name text not null,
  department text not null,
  unique (code, department)
);
insert into public.academic_programs (code, name, department) values
  ('BSHM', 'BS Hospitality Management', 'College of Management'),
  ('BSTM', 'BS Tourism Management', 'College of Management'),
  ('BSBA', 'BS Business Administration', 'College of Management'),
  ('BSA', 'BS Accountancy', 'College of Accountancy'),
  ('BSAIS', 'BS Accounting Information System', 'College of Accountancy'),
  ('BEED', 'Bachelor of Elementary Education', 'College of Education'),
  ('BSED', 'Bachelor of Secondary Education', 'College of Education'),
  ('BSNED', 'Bachelor of Special Needs Education', 'College of Education'),
  ('BSCRIM', 'BS Criminology', 'College of Criminal Justice Education'),
  ('BSCE', 'BS Civil Engineering', 'College of Engineering'),
  ('BSME', 'BS Mechanical Engineering', 'College of Engineering'),
  ('BSN', 'BS Nursing', 'College of Allied Health Sciences'),
  ('BSP', 'BS Pharmacy', 'College of Allied Health Sciences'),
  ('ABPSYCH', 'BA Psychology', 'College of Allied Health Sciences'),
  ('BSIT', 'BS Information Technology', 'College of Information Technology'),
  ('BSMARE', 'BS Marine Engineering', 'College of Maritime Education');
alter table public.academic_programs enable row level security;
revoke all on public.academic_programs from anon, authenticated;
grant select on public.academic_programs to anon, authenticated;
create policy "academic programs are public" on public.academic_programs
  for select to anon, authenticated using (true);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  department text not null check (department in ('College of Management', 'College of Accountancy', 'College of Education', 'College of Criminal Justice Education', 'College of Engineering', 'College of Allied Health Sciences', 'College of Information Technology', 'College of Maritime Education')),
  unique (name, department),
  unique (id, department)
);
alter table public.organizations enable row level security;
revoke all on public.organizations from anon, authenticated;
grant select on public.organizations to anon, authenticated;
create policy "organization labels are public" on public.organizations
  for select to anon, authenticated using (true);

-- This is the only existing organization; no other council or staff names are invented.
insert into public.organizations (name, department)
values ('CITE Council', 'College of Information Technology');

alter table public.role_assignments add column organization_id uuid references public.organizations(id);
update public.role_assignments set organization_id = (
  select id from public.organizations where name = 'CITE Council' and department = 'College of Information Technology'
) where role = 'cite_organizer';
alter table public.role_assignments drop constraint role_assignments_role_check;
alter table public.role_assignments add constraint role_assignments_role_check
  check (role in ('organizer', 'cite_organizer', 'event_admin'));
alter table public.role_assignments add constraint role_organization_is_consistent check (
  (role = 'event_admin' and organization_id is null)
  or (role in ('organizer', 'cite_organizer') and organization_id is not null)
);
create index role_assignments_organization on public.role_assignments (organization_id);

alter table public.events add column organization_id uuid;
update public.events set organization_id = (
  select id from public.organizations where name = 'CITE Council' and department = 'College of Information Technology'
);
alter table public.events alter column organization_id set not null;
alter table public.events drop constraint events_department_check;
alter table public.events drop constraint events_course_check;
alter table public.events alter column department drop default;
alter table public.events alter column course drop default;
alter table public.events add constraint events_academic_program_fkey
  foreign key (course, department) references public.academic_programs (code, department);
alter table public.events add constraint events_organization_department_fkey
  foreign key (organization_id, department) references public.organizations (id, department);
create index events_organization_department on public.events (organization_id, department);
create index events_course_department on public.events (course, department);

-- Both spellings recognize scoped organizer grants while older deployed clients finish upgrading.
create or replace function public.has_role(expected_role text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.role_assignments
    where user_id = (select auth.uid()) and (
      (expected_role in ('organizer', 'cite_organizer') and role in ('organizer', 'cite_organizer') and organization_id is not null)
      or (expected_role = 'event_admin' and role = 'event_admin')
    )
  );
$$;

-- Derive organization identity from the caller's trusted grant, including for older clients.
create schema if not exists private;
revoke all on schema private from public, anon, authenticated;
create function private.assign_event_organization()
returns trigger language plpgsql security invoker set search_path = '' as $$
declare assigned_organization uuid;
begin
  select organization_id into assigned_organization from public.role_assignments
  where user_id = (select auth.uid()) and role in ('organizer', 'cite_organizer');
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
revoke all on function private.assign_event_organization() from public, anon, authenticated;
create trigger assign_event_organization before insert on public.events
  for each row execute function private.assign_event_organization();

alter policy "organizers submit pending events" on public.events with check (
  created_by = (select auth.uid()) and (select public.has_role('organizer'))
  and organization_id = (select r.organization_id from public.role_assignments r where r.user_id = (select auth.uid()))
  and status = 'pending' and rejection_reason is null and reviewed_by is null and reviewed_at is null
);
alter policy "organizers read their submissions" on public.events
  using (created_by = (select auth.uid()) and (select public.has_role('organizer')));
-- Managed Storage policies retain their platform-owned definitions and names.
-- Their has_role('cite_organizer') predicates now recognize every scoped organizer;
-- UUID owner paths, private review reads, and approved-only public reads remain enforced.
