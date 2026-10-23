-- Reject values that bypass form limits or cannot be represented by the application.
alter table public.events add constraint event_schedule_is_supported check (
  isfinite(starts_at) and isfinite(ends_at)
  and starts_at >= timestamptz '0001-01-01 00:00:00+00'
  and ends_at < timestamptz '10000-01-01 00:00:00+00'
);
alter table public.events add constraint event_raw_text_is_bounded check (
  char_length(title) <= 200 and char_length(description) <= 5000
  and (rejection_reason is null or char_length(rejection_reason) <= 1000)
);
alter table public.organizations add constraint organization_raw_name_is_bounded
  check (char_length(name) <= 120);

-- Review state, IDs, and creation timestamps are database-owned fields.
revoke insert on public.events from authenticated;
grant insert (created_by, organization_id, title, description, image_path,
  starts_at, ends_at, department, course, target_year)
  on public.events to authenticated;
