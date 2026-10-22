"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { COURSE, DEPARTMENT, EventRow, IMAGE_BUCKET, philippineTimeToIso, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

const imageExtensions: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function OrganizerPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadEvents = useCallback(async () => {
    const { data, error: loadError } = await client.from("events").select("*").order("created_at", { ascending: false });
    if (loadError) {
      setError("Your submissions could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as EventRow[];
    setEvents(rows);
    setImageUrls(await signedImageUrls(client, rows));
  }, [client]);

  useEffect(() => {
    let active = true;
    async function checkAccess() {
      const { data: { user } } = await client.auth.getUser();
      if (!active) return;
      if (!user) { router.replace("/login"); return; }

      const { data: assignment } = await client.from("role_assignments").select("role").eq("user_id", user.id).single();
      if (!active) return;
      if (assignment?.role !== "cite_organizer") {
        router.replace(assignment?.role === "event_admin" ? "/admin" : "/");
        return;
      }
      setUserId(user.id);
      await loadEvents();
      if (active) setLoading(false);
    }
    void checkAccess();
    return () => { active = false; };
  }, [client, loadEvents, router]);

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

  if (loading) return <><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 text-sm text-muted-foreground" role="status">Checking organizer access…</main></>;

  return (
    <>
      <SiteHeader role="cite_organizer" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10"><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">CITE Council</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Submit an event</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">One submission sends your event to the PHINMA Event administrator. Approval publishes it automatically.</p></div>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)] lg:items-start">
          <Card>
            <CardHeader><div className="mb-2 flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><Plus className="size-5" aria-hidden="true" /></div><CardTitle>Event details</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={submitEvent} className="space-y-5">
                <div className="space-y-2"><Label htmlFor="title">Event name</Label><Input id="title" name="title" maxLength={200} required placeholder="e.g. CITE Tech Week" /></div>
                <div className="space-y-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" rows={5} maxLength={5000} required placeholder="What will happen at this event?" /></div>
                <div className="space-y-2"><Label htmlFor="image">Event picture or poster</Label><Input id="image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required /><p className="text-xs text-muted-foreground">JPG, PNG, or WebP, up to 5 MB.</p></div>
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
                {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                {notice && <p role="status" className="text-sm font-medium text-primary">{notice}</p>}
                <Button type="submit" disabled={busy} className="w-full">{busy ? "Submitting…" : "Submit for approval"}</Button>
              </form>
            </CardContent>
          </Card>

          <section aria-labelledby="submissions-title" className="space-y-5">
            <div><h2 id="submissions-title" className="text-2xl font-semibold">My submissions</h2><p className="mt-1 text-sm text-muted-foreground">Pending events stay private until approved.</p></div>
            {events.length ? events.map((item) => <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]}><p className="border-t border-border pt-4 text-sm font-semibold capitalize text-primary">{item.status}</p>{item.status === "rejected" && item.rejection_reason && <p className="text-sm text-destructive">Reason: {item.rejection_reason}</p>}</EventCard>) : <Card className="border-dashed"><CardContent className="py-12 text-center text-sm text-muted-foreground">No submissions yet. Your first event will appear here.</CardContent></Card>}
          </section>
        </div>
      </main>
    </>
  );
}
