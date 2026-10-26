"use client";

import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, ArrowUpRight, CalendarDays, Check, Eye, ImagePlus, LockKeyhole, PencilLine, Plus, RefreshCw, Send, ShieldCheck, X } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { EventDetails } from "@/components/event-details";
import { WorkspaceShell } from "@/components/workspace-shell";
import { useFeedbackToasts } from "@/components/toast-provider";
import { LoadingPanel } from "@/components/loading-panel";
import { EventStatus } from "@/components/event-status";
import { OrganizerEventPreview, type OrganizerPreview } from "@/components/organizer-event-preview";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_SELECT, EventRow, IMAGE_BUCKET, formatPhilippineTime, philippineTimeInput, philippineTimeToIso, signedImageUrls, yearLabel, type PublicEvent } from "@/lib/events";
import { colleges, collegeLabel } from "@/lib/academics";
import { posterExtension } from "@/lib/posters";
import { createClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/roles";
import "./organizer.css";

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
  const [editorOpen, setEditorOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [step, setStep] = useState<"details" | "preview">("details");
  const [filter, setFilter] = useState<"all" | EventRow["status"]>("all");
  const [draft, setDraft] = useState<PublicEvent | null>(null);
  const [previewNow, setPreviewNow] = useState(() => Date.now());
  const [selectedPreview, setSelectedPreview] = useState<OrganizerPreview | null>(null);
  useFeedbackToasts(error, notice);
  const formRef = useRef<HTMLFormElement>(null);
  const editorTrigger = useRef<HTMLElement | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const historyHeading = useRef<HTMLHeadingElement>(null);
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
        refreshTimer = setInterval(() => { setPreviewNow(Date.now()); void loadEvents(); }, 60_000);
      }
    }
    void checkAccess();
    return () => { active = false; clearInterval(refreshTimer); };
  }, [account, loadEvents, router]);

  async function refreshSubmissions() {
    try { await loadEvents(); }
    catch { setFetchError("Your submissions could not be loaded. Please refresh the page."); }
    if (editorOpen) {
      setShowHistory(true);
      setFilter("all");
      requestAnimationFrame(() => {
        historyHeading.current?.focus({ preventScroll: true });
        historyHeading.current?.scrollIntoView({ behavior: "instant", block: "start" });
      });
    }
  }

  function reviseEvent(item: EventRow | null) {
    setStep("details");
    setShowHistory(false);
    if (!editorOpen || editing?.id !== item?.id) {
      editorTrigger.current = document.activeElement as HTMLElement | null;
      setEditorOpen(true);
      setEditing(item);
      setDraft(null);
      setPosterPreview(null);
      setError("");
      setNotice("");
    }
    requestAnimationFrame(() => {
      const field = formRef.current?.querySelector<HTMLInputElement>("#title");
      field?.focus({ preventScroll: true });
      formRef.current?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth", block: "start" });
    });
  }

  function closeEditor() {
    setEditorOpen(false); setShowHistory(false); setStep("details"); setEditing(null); setPosterPreview(null); setDraft(null); setError("");
    requestAnimationFrame(() => { if (editorTrigger.current?.isConnected) editorTrigger.current.focus({ preventScroll: true }); else heading.current?.focus(); });
  }

  function backToDetails() {
    setStep("details");
    requestAnimationFrame(() => {
      formRef.current?.querySelector<HTMLInputElement>("#title")?.focus({ preventScroll: true });
      stepHeading.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }

  function readProposal(form: HTMLFormElement) {
    const fields = new FormData(form);
    const image = fields.get("image");
    const startsAt = philippineTimeToIso(String(fields.get("starts_at") ?? ""));
    const endsAt = philippineTimeToIso(String(fields.get("ends_at") ?? ""));
    const year = String(fields.get("target_year") ?? "");
    const course = String(fields.get("course") ?? "");
    const replacement = image instanceof File && image.size > 0 ? image : null;

    setError("");
    setNotice("");
    const title = String(fields.get("title") ?? "").trim();
    const description = String(fields.get("description") ?? "").trim();
    if (!title || !description || String(fields.get("title") ?? "").length > 200 || String(fields.get("description") ?? "").length > 5000) {
      setError("Enter an event name of 1–200 characters and a description of 1–5,000 characters.");
      return null;
    }
    if ((!editing && !replacement) || (replacement && !posterExtension(replacement))) {
      setError("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
      return null;
    }
    if (!courses.some(item => item.code === course) || !["", "1", "2", "3", "4"].includes(year)) {
      setError("Choose a valid course and year for your assigned department.");
      return null;
    }
    if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError("Enter a valid end time after the start time. Times are Philippine time.");
      return null;
    }
    if (!form.checkValidity()) {
      setError("Check the required event details before continuing.");
      return null;
    }
    return { title, description, replacement, startsAt, endsAt, course, year };
  }

  function previewEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!organization || submitting.current) return;
    const proposal = readProposal(event.currentTarget);
    if (!proposal) return;
    setDraft({ id: editing?.id ?? "draft", title: proposal.title, description: proposal.description, starts_at: proposal.startsAt, ends_at: proposal.endsAt, course: proposal.course, target_year: proposal.year ? Number(proposal.year) : null, organization, organization_id: organization.id, department: organization.department, image_path: editing?.image_path ?? "", status: "pending" });
    setStep("preview");
    requestAnimationFrame(() => {
      stepHeading.current?.focus({ preventScroll: true });
      stepHeading.current?.scrollIntoView({ behavior: "instant", block: "start" });
    });
  }

  async function submitEvent() {
    if (step !== "preview" || !draft || !userId || !organization || submitting.current || !formRef.current) return;
    const form = formRef.current;
    const proposal = readProposal(form);
    if (!proposal) { backToDetails(); return; }
    const { title, description, replacement, startsAt, endsAt, course, year } = proposal;

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
        title,
        description,
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
        setEditorOpen(false);
        setShowHistory(false);
        setStep("details");
        setDraft(null);
        setFilter("pending");
        setPosterPreview(null);
        setNotice(`${wasRevision ? "Resubmitted" : "Submitted"} — pending administrator review. Your event stays private until approved.`);
        if (previousPath && previousPath !== path) {
          const { error: cleanupError } = await client.storage.from(IMAGE_BUCKET).remove([previousPath]);
          if (cleanupError) setError(`Your revision was submitted, but the previous poster could not be removed. Contact the administrator. ${cleanupError.message}`);
        }
        await loadEvents();
        heading.current?.focus({ preventScroll: true });
      }
    } catch (cause) {
      setError(`${saved ? "Submitted, but a follow-up step failed." : "The request was interrupted. Refresh submissions before retrying; the poster was kept because the save may still complete."} ${cause instanceof Error ? cause.message : "Please try again."}`);
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  }

  if (account.error) return <WorkspaceShell title="My events"><p className="form-error" role="alert">{account.error}</p></WorkspaceShell>;
  if (loading || account.loading || account.role !== "organizer" || !organization) return <WorkspaceShell title="My events"><LoadingPanel>Checking organizer access…</LoadingPanel></WorkspaceShell>;

  const visible = filter === "all" ? events : events.filter(item => item.status === filter);
  const previewImage = posterPreview?.url ?? (editing ? imageUrls[editing.id] : undefined);

  return (
    <WorkspaceShell title="My events">
        <div className="page-heading organizer-heading"><div><h1 ref={heading} tabIndex={-1}>My events</h1><p>Prepare your next campus event and follow every submission in one place.</p><span className="organizer-publisher"><ShieldCheck size={15} aria-hidden="true" />{organization.name} · {collegeLabel(organization.department)}</span></div><div className="form-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => void refreshSubmissions()}><RefreshCw size={15} aria-hidden="true" />Refresh submissions</Button>{!editorOpen && <Button type="button" onClick={() => { reviseEvent(null); }}><Plus size={17} aria-hidden="true" />Create event</Button>}</div></div>
        <div className="summary-strip organizer-summary" hidden={editorOpen}><div><span>Pending review</span><strong>{fetchError ? "—" : events.filter(item => item.status === "pending").length}</strong></div><div><span>Published</span><strong>{fetchError ? "—" : events.filter(item => item.status === "approved").length}</strong></div><div><span>Rejected</span><strong>{fetchError ? "—" : events.filter(item => item.status === "rejected").length}</strong></div></div>
        {error && !editorOpen && <p role="alert" className="form-error">{error}</p>}
        {notice && <p role="status" className="success-notice"><Check size={17} aria-hidden="true" />{notice}</p>}
        {fetchError && <p role="alert" className="form-error">{fetchError}</p>}
        {editorOpen && <section className="organizer-composer organizer-two-step" data-step={step} aria-labelledby="editor-title">
          <div className="organizer-composer-toolbar"><p className="eyebrow">{editing ? "Revise a submission" : "Create a campus event"}</p><Button type="button" variant="ghost" disabled={busy} onClick={closeEditor}><X size={16} aria-hidden="true" />{editing ? "Cancel revision" : "Cancel creation"}</Button></div>
          <ol className="organizer-step-indicator" aria-label="Submission steps"><li aria-current={step === "details" ? "step" : undefined}><span>{step === "preview" ? <Check size={14} aria-hidden="true" /> : "1"}</span>Event details</li><li aria-current={step === "preview" ? "step" : undefined}><span>2</span>Preview &amp; submit</li></ol>
          <div className="organizer-step-heading"><h2 id="editor-title" ref={stepHeading} tabIndex={-1}>{step === "preview" ? "Preview your event" : editing ? "Make it ready for review." : "Bring campus together."}</h2><p>{step === "preview" ? "Check the poster, wording, schedule, and audience before sending your event to the administrator." : "Add the details below. You’ll review a full preview before submitting."}</p></div>
          {error && <p role="alert" className="form-error">{error}</p>}
          <div hidden={step !== "details"} className="organizer-detail-step">
          <Card className="event-form-card organizer-proposal-panel">
            <CardHeader><CardTitle>Event details</CardTitle><p className="text-sm text-muted-foreground">Your publisher and department follow your assigned university account.</p></CardHeader>
            <CardContent>
              <form key={editing?.id ?? "new"} ref={formRef} onSubmit={previewEvent} className="space-y-5 revision-form" aria-busy={busy}>
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
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="starts_at">Start date and time</Label><Input id="starts_at" name="starts_at" type="datetime-local" defaultValue={editing ? philippineTimeInput(editing.starts_at) : ""} required /></div>
                  <div className="space-y-2"><Label htmlFor="ends_at">End date and time</Label><Input id="ends_at" name="ends_at" type="datetime-local" defaultValue={editing ? philippineTimeInput(editing.ends_at) : ""} required /></div>
                </div>
                <p className="text-xs text-muted-foreground">Enter both times in Philippine time (PHT).</p>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={collegeLabel(organization.department)} readOnly /></div>
                  <div className="space-y-2"><Label htmlFor="course">Course</Label><select id="course" name="course" required defaultValue={editing?.course ?? courses[0]?.code ?? ""} className="course-select">{courses.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
                </div>
                <div className="space-y-2"><Label htmlFor="target_year">For which year?</Label><select id="target_year" name="target_year" defaultValue={editing?.target_year ?? ""} className="course-select"><option value="">All college years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
                <div className="form-submit-row"><span>Your draft stays private. Nothing uploads in this step.</span><div className="form-actions"><Button type="submit" disabled={busy}>Next: preview event<ArrowRight size={16} aria-hidden="true" /></Button></div></div>
                </fieldset>
              </form>
            </CardContent>
          </Card>
          </div>
          {step === "preview" && draft && <section className="organizer-confirm-step" aria-label="Private event preview">
            <p className="organizer-confirm-privacy"><LockKeyhole size={17} aria-hidden="true" /><span><strong>Private preview · not submitted</strong>Your event and poster stay private until administrator approval. Previewing does not upload or save anything.</span></p>
            <div className="organizer-full-preview" inert={busy}><EventDetails event={draft} imageUrl={previewImage} now={previewNow} preview headingId="organizer-draft-title" showActions={false} /></div>
            <div className="organizer-confirm-actions"><Button type="button" variant="outline" disabled={busy} onClick={backToDetails}><ArrowLeft size={16} aria-hidden="true" />Back to details</Button><div><p>Administrator approval publishes your event.</p><Button type="button" loading={busy} onClick={() => void submitEvent()}>{!busy && <Send size={16} aria-hidden="true" />}{busy ? "Submitting…" : editing ? "Resubmit for review" : "Submit for approval"}</Button></div></div>
          </section>}
        </section>}
        <section aria-labelledby="submissions-title" id="submissions" className="organizer-submissions" hidden={editorOpen && !showHistory}><div className="panel-section-heading"><div><h2 id="submissions-title" tabIndex={-1} ref={historyHeading}>Your submissions</h2><p className="text-sm text-muted-foreground">Only rejected events can be edited. Pending and published events stay locked.</p></div><span role="status">{fetchError ? "Unavailable" : `${visible.length} events`}</span></div>
          {editorOpen && showHistory && <p className="info-note">Your draft remains above. Check the refreshed submissions and their status before retrying an unconfirmed save.</p>}
          <div className="organizer-status-filters event-tabs" role="group" aria-label="My event status">{([{ value: "all", label: "All" }, { value: "pending", label: "Pending" }, { value: "approved", label: "Published" }, { value: "rejected", label: "Rejected" }] as const).map(({ value, label }) => <button key={value} type="button" className={filter === value ? "selected" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div>
          {fetchError ? null : visible.length ? <div className="organizer-submission-list">{visible.map(item => <article key={item.id} className="organizer-submission-row"><div className="organizer-submission-poster">{imageUrls[item.id] ? (
            // Signed poster URLs need to stay outside Next's public image cache.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={imageUrls[item.id]} alt={`Poster for ${item.title}`} loading="lazy" />
          ) : <span>Poster unavailable</span>}</div><div className="organizer-submission-content"><div className="organizer-submission-title"><h3>{item.title}</h3><EventStatus status={item.status} /></div><p className="organizer-submission-audience">{item.course} · {yearLabel(item.target_year)}</p><p className="organizer-submission-schedule"><CalendarDays size={15} aria-hidden="true" /><span>{formatPhilippineTime(item.starts_at)} – {formatPhilippineTime(item.ends_at)} PHT</span></p>{item.status === "rejected" ? <p className="rejection-note"><strong>Review note:</strong> {item.rejection_reason}</p> : <p className="submission-status"><LockKeyhole size={14} aria-hidden="true" />{item.status === "pending" ? "Pending administrator review · private until approved" : "Published · editing is locked"}</p>}<div className="organizer-row-actions"><Button type="button" variant="outline" disabled={busy} onClick={() => setSelectedPreview({ event: item, imageUrl: imageUrls[item.id], now: previewNow, view: "card" })}><Eye size={16} aria-hidden="true" />Preview event</Button>{item.status === "rejected" && <Button type="button" variant="outline" disabled={busy} onClick={() => { reviseEvent(item); }}><PencilLine size={15} aria-hidden="true" />Edit and resubmit</Button>}{item.status === "approved" && <Link href={`/events/${item.id}`} className="text-link">View published event<ArrowUpRight size={15} aria-hidden="true" /></Link>}</div></div></article>)}</div> : <Card><CardContent className="empty-state"><CalendarDays size={28} strokeWidth={1.5} aria-hidden="true" /><h3>{events.length ? "No events in this view" : "Your first event starts here"}</h3><p>{events.length ? "Choose another status to see your other submissions." : "Create your first event to prepare its poster, preview the announcement, and send it for review."}</p>{!events.length && !editorOpen && <Button type="button" variant="outline" onClick={() => { reviseEvent(null); }}><Plus size={16} aria-hidden="true" />Create your first event</Button>}</CardContent></Card>}
        </section>
        {selectedPreview && <OrganizerEventPreview preview={selectedPreview} onClose={() => setSelectedPreview(null)} />}
    </WorkspaceShell>
  );
}
