"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { EventDetails } from "@/components/event-details";
import { LoadingPanel } from "@/components/loading-panel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { colleges, collegeLabel } from "@/lib/academics";
import { EventRow, IMAGE_BUCKET, PublicEvent, philippineTimeInput, philippineTimeToIso } from "@/lib/events";
import { posterExtension } from "@/lib/posters";
import type { Organization } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";

export function AdminEventEditor({ event, imageUrl, now, onCancel, onSaved }: { event: EventRow | null; imageUrl?: string; now: number; onCancel: () => void; onSaved: (notice: string, error: string) => Promise<void> }) {
  const client = useMemo(() => createClient(), []);
  const { user } = useAccount();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState(event?.organization_id ?? "");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [poster, setPoster] = useState<{ file: File; url: string } | null>(null);
  const [draft, setDraft] = useState<PublicEvent | null>(null);
  const form = useRef<HTMLFormElement>(null);
  const saving = useRef(false);
  const previewTitle = useRef<HTMLHeadingElement>(null);
  const editorTitle = useRef<HTMLHeadingElement>(null);
  useEffect(() => { editorTitle.current?.focus({ preventScroll: true }); }, []);
  const organization = organizations.find(item => item.id === organizationId);
  const courses = colleges.find(item => item.name === organization?.department)?.courses ?? [];
  useEffect(() => () => { if (poster) URL.revokeObjectURL(poster.url); }, [poster]);
  useEffect(() => {
    let active = true;
    void client.from("organizations").select("id,name,department").order("name").then(({ data, error }) => {
      if (!active) return;
      if (error) setError("Publishers could not be loaded. Close the editor and try again.");
      else { setOrganizations(data ?? []); setOrganizationId(event?.organization_id ?? data?.[0]?.id ?? ""); }
      setLoading(false);
    });
    return () => { active = false; };
  }, [client, event?.organization_id]);

  function read() {
    if (!form.current || !organization) return null;
    const fields = new FormData(form.current);
    const title = String(fields.get("title") ?? "");
    const description = String(fields.get("description") ?? "");
    const starts_at = philippineTimeToIso(String(fields.get("starts_at") ?? ""));
    const ends_at = philippineTimeToIso(String(fields.get("ends_at") ?? ""));
    const course = String(fields.get("course") ?? "");
    const year = String(fields.get("target_year") ?? "");
    setError("");
    if (!title.trim() || title.length > 200 || !description.trim() || description.length > 5000
      || !starts_at || !ends_at || Date.parse(ends_at) <= Date.parse(starts_at)
      || !courses.some(item => item.code === course) || !["", "1", "2", "3", "4"].includes(year)
      || (!event && !poster) || (poster && !posterExtension(poster.file)) || !form.current.checkValidity()) {
      setError("Check the required details, valid Philippine schedule, course/year, and a JPG, PNG or WebP poster up to 5 MB.");
      return null;
    }
    return { title: title.trim(), description: description.trim(), starts_at, ends_at, course, target_year: year ? Number(year) : null };
  }
  function handlePreview(submission: FormEvent<HTMLFormElement>) {
    submission.preventDefault();
    const content = read();
    if (!content || !organization) return;
    setDraft({ ...content, id: event?.id ?? "draft", organization, organization_id: organization.id, department: organization.department, image_path: event?.image_path ?? "", status: event?.status ?? "pending" });
    requestAnimationFrame(() => previewTitle.current?.focus());
  }
  async function save() {
    const content = read();
    if (!content || !user || !organization || saving.current) return;
    saving.current = true; setBusy(true);
    let uploaded: string | null = null;
    let saved = false;
    try {
      const path = poster ? `${event?.created_by ?? user.id}/${crypto.randomUUID()}.${posterExtension(poster.file)}` : event!.image_path;
      if (poster) {
        const result = await client.storage.from(IMAGE_BUCKET).upload(path, poster.file, { contentType: poster.file.type });
        if (result.error) { setError(`Poster upload failed. ${result.error.message}`); return; }
        uploaded = path;
      }
      const result = await client.rpc("admin_save_event", {
        event_id: event?.id ?? null, expected_updated_at: event?.updated_at ?? null, publisher_id: organization.id,
        event_title: content.title, event_description: content.description, poster_path: path,
        event_starts_at: content.starts_at, event_ends_at: content.ends_at, event_course: content.course, event_year: content.target_year,
      });
      if (result.error) {
        const definite = result.status >= 400 && result.status < 500 && /^(22|23|42|P0)[0-9A-Z]{3}$/.test(result.error.code);
        let cleanupFailed = false;
        if (uploaded && definite) cleanupFailed = Boolean((await client.storage.from(IMAGE_BUCKET).remove([uploaded])).error);
        setError(`${definite ? "The event could not be saved." : "The save could not be confirmed. Refresh events before retrying; the poster was retained."} ${result.error.message}${cleanupFailed ? " The unused poster could not be removed." : ""}`);
        return;
      }
      saved = true;
      let cleanupError = "";
      if (event && path !== event.image_path && (await client.storage.from(IMAGE_BUCKET).remove([event.image_path])).error) cleanupError = "The event was saved, but its previous poster could not be removed.";
      await onSaved(event ? "Event changes saved. The existing publication status was preserved." : "Event created — pending review. Use Approve and publish when ready.", cleanupError);
    } catch {
      setError(saved ? "The event was saved, but cleanup or refresh could not be confirmed. Refresh the events before continuing." : "The save could not be confirmed. Refresh events before retrying; any uploaded poster was retained.");
    } finally { saving.current = false; setBusy(false); }
  }

  return <section className="admin-event-editor" aria-labelledby="admin-editor-title">
    <div className="panel-section-heading"><div><h1 id="admin-editor-title" ref={editorTitle} tabIndex={-1}>{event ? "Edit event" : "Create event"}</h1><p>{event?.status === "approved" ? "Saved changes to this published event appear immediately." : "Preview the full announcement before saving. New events begin pending review."}</p></div><Button variant="outline" disabled={busy} onClick={onCancel}>Cancel</Button></div>
    {error && <p role="alert" className="form-error">{error}</p>}
    {loading ? <LoadingPanel>Loading publishers…</LoadingPanel> : !organization ? error ? null : <p className="info-note">Create a publisher through Manage organizers before creating an event.</p> : <>
      <form ref={form} onSubmit={handlePreview} hidden={Boolean(draft)} className="admin-event-form">
        <div className="space-y-2"><Label htmlFor="admin-publisher">Publisher</Label><select id="admin-publisher" className="course-select" value={organizationId} disabled={Boolean(event)} onChange={e => setOrganizationId(e.target.value)}>{organizations.map(item => <option key={item.id} value={item.id}>{item.name} · {collegeLabel(item.department)}</option>)}</select><p className="text-xs text-muted-foreground">{collegeLabel(organization.department)}{event ? " · Original publisher and creator are preserved." : ""}</p></div>
        <div className="space-y-2"><Label htmlFor="admin-title">Event name</Label><Input id="admin-title" name="title" maxLength={200} defaultValue={event?.title} required /></div>
        <div className="space-y-2"><Label htmlFor="admin-description">Description</Label><Textarea id="admin-description" name="description" rows={5} maxLength={5000} defaultValue={event?.description} required /></div>
        <div className="space-y-2"><Label htmlFor="admin-poster">{event ? "Replace poster (optional)" : "Event poster"}</Label><Input id="admin-poster" type="file" accept="image/jpeg,image/png,image/webp" required={!event} onChange={e => {
          const file = e.target.files?.[0];
          if (file && !posterExtension(file)) { e.target.value = ""; setPoster(null); setError("Choose a JPG, PNG or WebP poster up to 5 MB."); return; }
          setPoster(file ? { file, url: URL.createObjectURL(file) } : null);
        }} /></div>
        <div className="admin-form-grid"><div className="space-y-2"><Label htmlFor="admin-start">Start · Philippine time</Label><Input id="admin-start" name="starts_at" type="datetime-local" required defaultValue={event ? philippineTimeInput(event.starts_at) : ""} /></div><div className="space-y-2"><Label htmlFor="admin-end">End · Philippine time</Label><Input id="admin-end" name="ends_at" type="datetime-local" required defaultValue={event ? philippineTimeInput(event.ends_at) : ""} /></div><div className="space-y-2"><Label htmlFor="admin-course">Course</Label><select id="admin-course" key={organizationId} name="course" className="course-select" defaultValue={event?.course ?? courses[0]?.code} required>{courses.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div><div className="space-y-2"><Label htmlFor="admin-year">Year level</Label><select id="admin-year" name="target_year" className="course-select" defaultValue={event?.target_year ?? ""}><option value="">All college years</option>{[1,2,3,4].map(year => <option key={year} value={year}>{year}{year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} Year</option>)}</select></div></div>
        <Button type="submit">Next: preview event<ArrowRight size={16} aria-hidden="true" /></Button>
      </form>
      {draft && <section aria-label="Administrator event preview"><h2 ref={previewTitle} tabIndex={-1}>Preview your event</h2><EventDetails event={draft} imageUrl={poster?.url ?? imageUrl} now={now} preview showActions={false} headingId="admin-preview-title" /><div className="admin-editor-actions"><Button variant="outline" disabled={busy} onClick={() => { setDraft(null); requestAnimationFrame(() => form.current?.querySelector<HTMLInputElement>("input[name=title]")?.focus()); }}><ArrowLeft size={16} aria-hidden="true" />Back to details</Button><Button loading={busy} onClick={() => void save()}>{event ? "Save changes" : "Create pending event"}</Button></div></section>}
    </>}
  </section>;
}
