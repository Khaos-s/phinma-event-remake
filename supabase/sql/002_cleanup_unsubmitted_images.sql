-- Let an organizer remove an image if the event insert fails after upload.
create policy "organizers remove unsubmitted images"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'event-images'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (select public.has_role('cite_organizer'))
    and not exists (select 1 from public.events where image_path = name)
  );
