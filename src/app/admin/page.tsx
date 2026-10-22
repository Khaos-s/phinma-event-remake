"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardCheck } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventRow, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

export default function AdminPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadEvents = useCallback(async () => {
    const { data, error: loadError } = await client.from("events").select("*").order("created_at", { ascending: false });
    if (loadError) {
      setError("The review queue could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as EventRow[];
    setEvents(rows);
    setImageUrls(await signedImageUrls(client, rows));
  }, [client]);

  useEffect(() => {
    let active = true;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    async function checkAccess() {
      const { data: { user } } = await client.auth.getUser();
      if (!active) return;
      if (!user) { router.replace("/login"); return; }

      const { data: assignment } = await client.from("role_assignments").select("role").eq("user_id", user.id).single();
      if (!active) return;
      if (assignment?.role !== "event_admin") {
        router.replace(assignment?.role === "cite_organizer" ? "/organizer" : "/");
        return;
      }
      await loadEvents();
      if (active) {
        setLoading(false);
        refreshTimer = setInterval(() => void loadEvents(), 30_000);
      }
    }
    void checkAccess();
    return () => { active = false; clearInterval(refreshTimer); };
  }, [client, loadEvents, router]);

  async function review(eventId: string, action: "approve" | "reject") {
    const reason = (reasons[eventId] ?? "").trim();
    setError("");
    setNotice("");
    if (action === "reject" && (!reason || reason.length > 1000)) {
      setError("Enter a rejection reason of 1–1000 characters.");
      return;
    }

    setBusyId(eventId);
    const { error: reviewError } = action === "approve"
      ? await client.rpc("approve_event", { event_id: eventId })
      : await client.rpc("reject_event", { event_id: eventId, reason });
    if (reviewError) {
      setError("Review failed. The event may have already been reviewed; refresh and try again.");
    } else {
      setNotice(action === "approve" ? "Event approved and published." : "Event rejected; the organizer can see your reason.");
      await loadEvents();
    }
    setBusyId("");
  }

  if (loading) return <><SiteHeader /><main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12 text-sm text-muted-foreground" role="status">Checking administrator access…</main></>;

  const pending = events.filter((item) => item.status === "pending");
  const reviewed = events.filter((item) => item.status !== "pending");

  return (
    <>
      <SiteHeader role="event_admin" />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">PHINMA Event administration</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Review events</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">A CITE Council submission stays private until you approve it. Approval publishes it immediately.</p></div>
          <div className="w-fit rounded-2xl border border-primary/20 bg-primary/5 px-5 py-3 text-sm font-semibold text-primary" role="status">{pending.length} pending</div>
        </div>
        {error && <p role="alert" className="mb-5 text-sm text-destructive">{error}</p>}
        {notice && <p role="status" className="mb-5 text-sm font-medium text-primary">{notice}</p>}

        <section aria-labelledby="pending-title">
          <h2 id="pending-title" className="mb-5 text-2xl font-semibold">Waiting for review</h2>
          {pending.length ? <div className="grid gap-6 md:grid-cols-2">{pending.map((item) => (
            <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]}>
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2"><Label htmlFor={`reason-${item.id}`}>Reason if rejecting</Label><Textarea id={`reason-${item.id}`} value={reasons[item.id] ?? ""} maxLength={1000} rows={3} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Tell the organizer what needs to change" /></div>
                <div className="flex flex-wrap gap-2"><Button disabled={Boolean(busyId)} onClick={() => void review(item.id, "approve")}>{busyId === item.id ? "Reviewing…" : "Approve and publish"}</Button><Button disabled={Boolean(busyId)} variant="outline" onClick={() => void review(item.id, "reject")}>Reject</Button></div>
              </div>
            </EventCard>
          ))}</div> : <Card className="border-dashed"><CardContent className="py-14 text-center"><ClipboardCheck className="mx-auto mb-4 size-8 text-primary" aria-hidden="true" /><p className="font-semibold">All caught up</p><p className="mt-2 text-sm text-muted-foreground">New submissions appear here automatically while this page is open.</p></CardContent></Card>}
        </section>

        {reviewed.length > 0 && <section aria-labelledby="reviewed-title" className="mt-12"><h2 id="reviewed-title" className="mb-5 text-2xl font-semibold">Reviewed</h2><div className="grid gap-6 md:grid-cols-2">{reviewed.map((item) => <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]}><p className="border-t border-border pt-4 text-sm font-semibold capitalize text-primary">{item.status}</p>{item.status === "rejected" && item.rejection_reason && <p className="text-sm text-destructive">Reason: {item.rejection_reason}</p>}</EventCard>)}</div></section>}
      </main>
    </>
  );
}
