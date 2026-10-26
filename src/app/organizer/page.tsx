"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, LockKeyhole, PencilLine, RefreshCw, Send, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { EventCard } from "@/components/event-card";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_SELECT, EventRow, IMAGE_BUCKET, philippineTimeInput, philippineTimeToIso, signedImageUrls } from "@/lib/events";
import { colleges } from "@/lib/academics";
import { posterExtension } from "@/lib/posters";
import { createClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/roles";

export default function OrganizerPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const account = useAccount();
  const userId = account.user?.id;
  const organization = account.organization;
  const courses = colleges.find(college => college.name === organization?.department)?.courses ?? [];
  const [posterPreview, setPosterPreview] = useState<{ file: File; url: string } | null>(null);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [editing, setEditing] = useState<EventRow | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const submitting = useRef(false);
  const loadRevision = useRef(0);

  useEffect(() => () => { if (posterPreview) URL.revokeObjectURL(posterPreview.url); }, [posterPreview]);

  const loadEvents = useCallback(async () => {
    if (!userId) return;
    const revision = ++loadRevision.current;
    const { data, error: loadError } = await client.rpc("workspace_events").select(EVENT_SELECT).eq("created_by", userId).order("created_at", { ascending: false });
    if (revision !== loadRevision.current) return;
    if (loadError) {
      setFetchError("Your submissions could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as unknown as EventRow[];
    const urls = await signedImageUrls(client, rows);
    if (revision !== loadRevision.current) return;
    setFetchError("");
    setEvents(rows);
    setImageUrls(urls);
  }, [client, userId]);

  useEffect(() => {
    let active = true;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    async function checkAccess() {
      if (account.loading || account.error) return;
      if (!account.user) { router.replace("/login"); return; }
      if (account.role !== "organizer") { router.replace(roleHome(account.role)); return; }
      await loadEvents();
      if (active) {
        setLoading(false);
        refreshTimer = setInterval(() => void loadEvents(), 60_000);
      }
    }
    void checkAccess();
    return () => { active = false; clearInterval(refreshTimer); };
  }, [account, loadEvents, router]);

  function reviseEvent(item: EventRow | null) {
    setEditing(item);
    setPosterPreview(null);
    setError("");
    setNotice("");
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLInputElement>("#title");
      field?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
  }

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId || !organization || submitting.current) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const image = fields.get("image");
    const startsAt = philippineTimeToIso(String(fields.get("starts_at") ?? ""));
    const endsAt = philippineTimeToIso(String(fields.get("ends_at") ?? ""));
    const year = String(fields.get("target_year") ?? "");
    const course = String(fields.get("course") ?? "");
    const replacement = image instanceof File && image.size > 0 ? image : null;

    setError("");
    setNotice("");
    if (!String(fields.get("title") ?? "").trim() || !String(fields.get("description") ?? "").trim()) {
      setError("Enter an event name and a description before submitting.");
      return;
    }
    if ((!editing && !replacement) || (replacement && !posterExtension(replacement))) {
      setError("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
      return;
    }
    if (!courses.some(item => item.code === course) || !["", "1", "2", "3", "4"].includes(year)) {
      setError("Choose a valid course and year for your assigned department.");
      return;
    }
    if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError("Enter a valid end time after the start time. Times are Philippine time.");
      return;
    }

    submitting.current = true;
    setBusy(true);
    let uploadedPath: string | null = null;
    let saved = false;
    try {
      const path = replacement ? `${userId}/${crypto.randomUUID()}.${posterExtension(replacement)}` : editing!.image_path;
      if (replacement) {
        const { error: uploadError } = await client.storage.from(IMAGE_BUCKET).upload(path, replacement, { contentType: replacement.type });
        if (uploadError) throw new Error(`The image could not be uploaded. ${uploadError.message}`);
        uploadedPath = path;
      }
      const content = {
        title: String(fields.get("title") ?? "").trim(),
        description: String(fields.get("description") ?? "").trim(),
        image_path: path,
        starts_at: startsAt,
        ends_at: endsAt,
        course,
        target_year: year ? Number(year) : null,
      };
      const { error: saveError, status: saveStatus } = editing
        ? await client.rpc("resubmit_event", {
          event_id: editing.id, revised_title: content.title, revised_description: content.description,
          revised_image_path: path, revised_starts_at: startsAt, revised_ends_at: endsAt,
          revised_course: course, revised_target_year: content.target_year,
        })
        : await client.from("events").insert({ ...content, created_by: userId, organization_id: organization.id, department: organization.department });
      if (saveError) {
        // A lost response can outlive the request; only a definite rejection is safe to clean up.
        const rejected = saveStatus >= 400 && saveStatus < 500 && /^(22|23|42|P0)[0-9A-Z]{3}$/.test(saveError.code);
        let cleanupFailed = false;
        if (uploadedPath && rejected) {
          const { error: cleanupError } = await client.storage.from(IMAGE_BUCKET).remove([uploadedPath]);
          cleanupFailed = Boolean(cleanupError);
        }
        setError(rejected
          ? `The event could not be ${editing ? "resubmitted" : "submitted"}. ${saveError.message}${cleanupFailed ? " The uploaded poster could not be removed. Contact the administrator before trying again." : " Refresh submissions before trying again."}`
          : `The submission result could not be confirmed. Refresh submissions before retrying. ${uploadedPath ? "The uploaded poster was kept because the save may still complete. " : ""}${saveError.message}`);
      } else {
        saved = true;
        const previousPath = editing?.image_path;
        const wasRevision = Boolean(editing);
        form.reset();
        setEditing(null);
        setPosterPreview(null);
        setNotice(`${wasRevision ? "Resubmitted" : "Submitted"} — pending administrator review. Your event stays private until approved.`);
        if (previousPath && previousPath !== path) {
          const { error: cleanupError } = await client.storage.from(IMAGE_BUCKET).remove([previousPath]);
          if (cleanupError) setError(`Your revision was submitted, but the previous poster could not be removed. Contact the administrator. ${cleanupError.message}`);
        }
        await loadEvents();
      }
    } catch (cause) {
      setError(`${saved ? "Submitted, but a follow-up step failed." : "The request was interrupted. Refresh submissions before retrying; the poster was kept because the save may still complete."} ${cause instanceof Error ? cause.message : "Please try again."}`);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (account.error) return <WorkspaceShell title="Create an event"><p className="form-error" role="alert">{account.error}</p></WorkspaceShell>;
  if (loading || account.loading || account.role !== "organizer" || !organization) return <WorkspaceShell title="Create an event"><p className="loading-panel" role="status">Checking organizer access…</p></WorkspaceShell>;

  return (
    <WorkspaceShell title={editing ? "Revise an event" : "Create an event"}>
        <div className="page-heading"><div><h1>{editing ? "Make it ready." : "Bring campus together."}</h1><p>{editing ? "Use the review note to revise your event and send it for another review." : "Create an event, follow its review, and share it with your community."}</p></div><span className="role-badge"><ShieldCheck size={14} aria-hidden="true" />{organization.name}</span></div>
        <div className="summary-strip"><div><span>Pending review</span><strong>{fetchError ? "—" : events.filter(item => item.status === "pending").length}</strong></div><div><span>Published</span><strong>{fetchError ? "—" : events.filter(item => item.status === "approved").length}</strong></div><div><span>Rejected</span><strong>{fetchError ? "—" : events.filter(item => item.status === "rejected").length}</strong></div></div>
        <div className="organizer-layout">
          <Card className="event-form-card">
            <CardHeader><CardTitle>{editing ? "Revise your submission" : "Event details"}</CardTitle><p className="text-sm text-muted-foreground">{editing ? "Your changes will return this event to the administrator’s queue." : "Tell the community what’s happening."}</p></CardHeader>
            <CardContent>
              <form key={editing?.id ?? "new"} ref={formRef} onSubmit={submitEvent} className="space-y-5 revision-form" aria-busy={busy}>
                <fieldset disabled={busy} className="space-y-5">
                {editing && <div className="revision-note"><PencilLine size={18} aria-hidden="true" /><div><strong>Administrator’s review note</strong><p>{editing.rejection_reason}</p><span>Revise the details below. The event stays private during review.</span></div></div>}
                <div className="space-y-2"><Label htmlFor="title">Event name</Label><Input id="title" name="title" maxLength={200} required defaultValue={editing?.title ?? ""} placeholder="Give your event a clear name" /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={5} maxLength={5000} required defaultValue={editing?.description ?? ""} placeholder="What will happen at this event?" /></div>
                <div className="poster-field"><Label htmlFor="image"><ImagePlus size={18} aria-hidden="true" />{editing ? "Keep or replace your poster" : "Event picture or poster"}</Label><p>{editing ? "Your current poster is kept unless you choose a replacement." : "A clear image helps your event stand out on the board."}</p><Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!editing} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file && !posterExtension(file)) { event.target.value = ""; setPosterPreview(null); setError("Choose a JPG, PNG, or WebP image no larger than 5 MB."); return; }
                  setPosterPreview(file ? { file, url: URL.createObjectURL(file) } : null); setError("");
                }} /><p className="field-hint">JPG, PNG, or WebP, up to 5 MB.</p>{posterPreview && <figure className="poster-local-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={posterPreview.url} alt="Selected event poster preview" /><figcaption>{posterPreview.file.name} · {(posterPreview.file.size / 1024).toFixed(0)} KB<span>Preview only. The image uploads when you submit.</span></figcaption>
                </figure>}{!posterPreview && editing && imageUrls[editing.id] && <figure className="poster-local-preview">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrls[editing.id]} alt={`Current poster for ${editing.title}`} /><figcaption>Current poster · kept unless replaced</figcaption>
                </figure>}</div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="starts_at">Start date and time</Label><Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={editing ? philippineTimeInput(editing.starts_at) : ""} required /></div>
                  <div className="space-y-2"><Label htmlFor="ends_at">End date and time</Label><Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={editing ? philippineTimeInput(editing.ends_at) : ""} required /></div>
                </div>
                <p className="text-xs text-muted-foreground">Enter both times in Philippine time (PHT).</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={organization.department} readOnly /></div>
                  <div className="space-y-2"><Label htmlFor="course">Course</Label><select id="course" name="course" required defaultValue={editing?.course ?? courses[0]?.code ?? ""} className="course-select">{courses.map(item => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="target_year">For which year?</Label><select id="target_year" name="target_year" defaultValue={editing?.target_year ?? ""} className="course-select"><option value="">All college years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
                {error && <p role="alert" className="form-error">{error}</p>}
                {notice && <p role="status" className="success-notice"><Check size={17} aria-hidden="true" />{notice}</p>}
                <div className="form-submit-row"><span>Approval publishes your event automatically.</span><div className="form-actions">{editing && <Button type="button" variant="outline" onClick={() => reviseEvent(null)}>Cancel revision</Button>}<Button type="submit"><Send size={15} aria-hidden="true" />{busy ? "Submitting…" : editing ? "Resubmit for review" : "Submit for approval"}</Button></div></div>
                </fieldset>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="submissions-title" id="submissions" className="submission-rail">
            <div className="review-guide"><div className="panel-section-heading"><h2>From idea to event</h2><ShieldCheck size={19} aria-hidden="true" /></div><ol className="review-steps"><li><strong>Prepare</strong><span>Add your poster, schedule, and audience.</span></li><li><strong>Review</strong><span>Pending events stay private. Revise a rejected event using the review note.</span></li><li><strong>Publish</strong><span>Administrator approval puts your event on the board.</span></li></ol></div>
            <div className="panel-section-heading"><h2 id="submissions-title">My submissions</h2><span>{fetchError ? "Unavailable" : events.length}</span></div>
            <Button type="button" variant="outline" onClick={() => void loadEvents()}><RefreshCw size={15} aria-hidden="true" />Refresh submissions</Button>
            {fetchError ? <p role="alert" className="form-error">{fetchError}</p> : events.length ? events.map((item) => <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]}>
              {item.status === "rejected" ? <div className="submission-action"><p className="rejection-note"><strong>Review note:</strong> {item.rejection_reason}</p><Button type="button" variant="outline" disabled={busy} onClick={() => reviseEvent(item)}><PencilLine size={15} aria-hidden="true" />Edit and resubmit</Button></div> : <p className="submission-status"><LockKeyhole size={15} aria-hidden="true" />{item.status === "pending" ? "Pending administrator review · private until approved" : "Published · editing is locked"}</p>}
            </EventCard>) : <Card><CardContent className="empty-state"><Send size={27} strokeWidth={1.5} aria-hidden="true" /><h3>Your first event starts here</h3><p>Submitted events appear here with their review status.</p></CardContent></Card>}
          </section>
        </div>
    </WorkspaceShell>
  );
}
