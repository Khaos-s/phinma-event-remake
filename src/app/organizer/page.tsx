"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ImagePlus, Send, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { EventCard } from "@/components/event-card";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSE, DEPARTMENT, EventRow, IMAGE_BUCKET, philippineTimeToIso, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/roles";

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function OrganizerPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const account = useAccount();
  const userId = account.user?.id;
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fetchError, setFetchError] = useState("");

  const loadEvents = useCallback(async () => {
    if (!userId) return;
    const { data, error: loadError } = await client.from("events").select("*").eq("created_by", userId).order("created_at", { ascending: false });
    if (loadError) {
      setFetchError("Your submissions could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as EventRow[];
    setFetchError("");
    setEvents(rows);
    setImageUrls(await signedImageUrls(client, rows));
  }, [client, userId]);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      if (account.loading || account.error) return;
      if (!account.user) { router.replace("/login"); return; }
      if (account.role !== "cite_organizer") { router.replace(roleHome(account.role)); return; }
      await loadEvents();
      if (active) setLoading(false);
    }
    void checkAccess();
    return () => { active = false; };
  }, [account, loadEvents, router]);

  async function submitEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!userId) return;
    const form = event.currentTarget;
    const fields = new FormData(form);
    const image = fields.get("image");
    const startsAt = philippineTimeToIso(String(fields.get("starts_at") ?? ""));
    const endsAt = philippineTimeToIso(String(fields.get("ends_at") ?? ""));
    const year = String(fields.get("target_year") ?? "");

    setError("");
    setNotice("");
    if (!String(fields.get("title") ?? "").trim() || !String(fields.get("description") ?? "").trim()) {
      setError("Enter an event name and a description before submitting.");
      return;
    }
    if (!(image instanceof File) || !image.size || !imageExtensions[image.type] || image.size > 5 * 1024 * 1024) {
      setError("Choose a JPG, PNG, or WebP image no larger than 5 MB.");
      return;
    }
    if (!startsAt || !endsAt || Date.parse(endsAt) <= Date.parse(startsAt)) {
      setError("Enter a valid end time after the start time. Times are Philippine time.");
      return;
    }

    setBusy(true);
    const path = `${userId}/${crypto.randomUUID()}.${imageExtensions[image.type]}`;
    const { error: uploadError } = await client.storage.from(IMAGE_BUCKET).upload(path, image, { contentType: image.type });
    if (uploadError) {
      setError("The image could not be uploaded. Please try again.");
      setBusy(false);
      return;
    }

    const { error: insertError } = await client.from("events").insert({
      created_by: userId,
      title: String(fields.get("title") ?? "").trim(),
      description: String(fields.get("description") ?? "").trim(),
      image_path: path,
      starts_at: startsAt,
      ends_at: endsAt,
      department: DEPARTMENT,
      course: COURSE,
      target_year: year ? Number(year) : null,
    });
    if (insertError) {
      await client.storage.from(IMAGE_BUCKET).remove([path]);
      setError("The event could not be submitted. Check the fields and try again.");
    } else {
      form.reset();
      setNotice("Submitted for administrator review. It will appear publicly after approval.");
      await loadEvents();
    }
    setBusy(false);
  }

  if (account.error) return <WorkspaceShell title="Create an event"><p className="form-error" role="alert">{account.error}</p></WorkspaceShell>;
  if (loading || account.loading || account.role !== "cite_organizer") return <WorkspaceShell title="Create an event"><p className="loading-panel" role="status">Checking organizer access…</p></WorkspaceShell>;

  return (
    <WorkspaceShell title="Create an event">
        <div className="page-heading"><div><h1>Create an event</h1><p>A new idea. A shared experience. Start with the details.</p></div><span className="role-badge"><ShieldCheck size={14} aria-hidden="true" />CITE Council</span></div>
        <div className="summary-strip"><div><span>Pending review</span><strong>{fetchError ? "—" : events.filter(item => item.status === "pending").length}</strong></div><div><span>Published</span><strong>{fetchError ? "—" : events.filter(item => item.status === "approved").length}</strong></div><div><span>Rejected</span><strong>{fetchError ? "—" : events.filter(item => item.status === "rejected").length}</strong></div></div>
        <div className="organizer-layout">
          <Card className="event-form-card">
            <CardHeader><CardTitle>Event details</CardTitle><p className="text-sm text-muted-foreground">Tell the community what’s happening.</p></CardHeader>
            <CardContent>
              <form onSubmit={submitEvent} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="title">Event name</Label><Input id="title" name="title" maxLength={200} required placeholder="Give your event a clear name" /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={5} maxLength={5000} required placeholder="What will happen at this event?" /></div>
                <div className="poster-field"><Label htmlFor="image"><ImagePlus size={18} aria-hidden="true" />Event picture or poster</Label><p>A clear image helps your event stand out on the board.</p><Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required /><p className="field-hint">JPG, PNG, or WebP, up to 5 MB.</p></div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="starts_at">Start date and time</Label><Input id="starts_at" name="starts_at" type="datetime-local" required /></div>
                  <div className="space-y-2"><Label htmlFor="ends_at">End date and time</Label><Input id="ends_at" name="ends_at" type="datetime-local" required /></div>
                </div>
                <p className="text-xs text-muted-foreground">Enter both times in Philippine time (PHT).</p>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div className="space-y-2"><Label htmlFor="department">Department</Label><Input id="department" value={DEPARTMENT} readOnly /></div>
                  <div className="space-y-2"><Label htmlFor="course">Course</Label><Input id="course" value="BS Information Technology (BSIT)" readOnly /></div>
                </div>
                <div className="space-y-2"><Label htmlFor="target_year">For which year?</Label><select id="target_year" name="target_year" defaultValue="" className="flex h-10 w-full rounded-[var(--radius)] border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">All college years</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
                {error && <p role="alert" className="form-error">{error}</p>}
                {notice && <p role="status" className="success-notice"><Check size={17} aria-hidden="true" />{notice}</p>}
                <div className="form-submit-row"><span>Approval publishes your event automatically.</span><Button type="submit" disabled={busy}><Send size={15} aria-hidden="true" />{busy ? "Submitting…" : "Submit for approval"}</Button></div>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="submissions-title" id="submissions" className="submission-rail">
            <div className="review-guide"><div className="panel-section-heading"><h2>From idea to event</h2><ShieldCheck size={19} aria-hidden="true" /></div><ul className="check-list"><li><Check size={16} aria-hidden="true" />Add your poster, schedule, and audience.</li><li><Check size={16} aria-hidden="true" />Submit once for administrator review.</li><li><Check size={16} aria-hidden="true" />Approval adds it to the public calendar.</li></ul></div>
            <div className="panel-section-heading"><h2 id="submissions-title">My submissions</h2><span>{fetchError ? "Unavailable" : events.length}</span></div>
            {fetchError ? <p role="alert" className="form-error">{fetchError}</p> : events.length ? events.map((item) => <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]} />) : <Card><CardContent className="empty-state"><Send size={27} strokeWidth={1.5} aria-hidden="true" /><h3>Your first event starts here</h3><p>Submitted events appear here with their review status.</p></CardContent></Card>}
          </section>
        </div>
    </WorkspaceShell>
  );
}
