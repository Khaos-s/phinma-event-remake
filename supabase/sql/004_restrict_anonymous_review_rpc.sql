-- Supabase defaults may grant functions to anon explicitly, independently of PUBLIC.
revoke all on function public.approve_event(uuid) from public, anon;
revoke all on function public.reject_event(uuid, text) from public, anon;
revoke all on function public.has_role(text) from public, anon;
grant execute on function public.approve_event(uuid) to authenticated;
grant execute on function public.reject_event(uuid, text) to authenticated;
grant execute on function public.has_role(text) to authenticated;
