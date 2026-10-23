"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ClipboardCheck, RefreshCw, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { EventCard } from "@/components/event-card";
import { WorkspaceShell } from "@/components/workspace-shell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EventRow, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/roles";

export default function AdminPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const account = useAccount();
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fetchError, setFetchError] = useState("");

  const loadEvents = useCallback(async () => {
    const { data, error: loadError } = await client.from("events").select("*").order("created_at", { ascending: false });
    if (loadError) {
      setFetchError("The review queue could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as EventRow[];
    setFetchError("");
    setEvents(rows);
    setImageUrls(await signedImageUrls(client, rows));
  }, [client]);

  useEffect(() => {
    let active = true;
    let refreshTimer: ReturnType<typeof setInterval> | undefined;
    async function checkAccess() {
      if (account.loading || account.error) return;
      if (!account.user) { router.replace("/login"); return; }
      if (account.role !== "event_admin") { router.replace(roleHome(account.role)); return; }
      await loadEvents();
      if (active) {
        setLoading(false);
        refreshTimer = setInterval(() => void loadEvents(), 30_000);
      }
    }
    void checkAccess();
    return () => { active = false; clearInterval(refreshTimer); };
  }, [account, loadEvents, router]);

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

  if (account.error) return <WorkspaceShell title="Review events"><p className="form-error" role="alert">{account.error}</p></WorkspaceShell>;
  if (loading || account.loading || account.role !== "event_admin") return <WorkspaceShell title="Review events"><p className="loading-panel" role="status">Checking administrator access…</p></WorkspaceShell>;

  const pending = events.filter((item) => item.status === "pending");
  const reviewed = events.filter((item) => item.status !== "pending");
  const published = events.filter((item) => item.status === "approved").length;

  return (
    <WorkspaceShell title="Review events">
        <div className="page-heading">
          <div><h1>Review events</h1><p>Give the next campus moment the green light.</p></div>
          <Button variant="outline" onClick={() => void loadEvents()}><RefreshCw size={15} aria-hidden="true" />Refresh queue</Button>
        </div>
        <div className="summary-strip"><div><span>Awaiting review</span><strong>{fetchError ? "—" : pending.length}</strong></div><div><span>Published</span><strong>{fetchError ? "—" : published}</strong></div><div><span>Rejected</span><strong>{fetchError ? "—" : reviewed.length - published}</strong></div></div>
        {(error || fetchError) && <p role="alert" className="form-error">{error || fetchError}</p>}
        {notice && <p role="status" className="success-notice"><Check size={17} aria-hidden="true" />{notice}</p>}

        <div className="admin-layout"><section aria-labelledby="pending-title">
          <div className="panel-section-heading"><h2 id="pending-title">Waiting for review</h2><span className="status-badge status-pending">{fetchError ? "Unavailable" : `${pending.length} pending`}</span></div>
          {pending.length ? <div className="admin-event-list">{pending.map((item) => (
            <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]}>
              <div className="space-y-4 border-t border-border pt-4">
                <div className="space-y-2"><Label htmlFor={`reason-${item.id}`}>Reason if rejecting</Label><Textarea id={`reason-${item.id}`} value={reasons[item.id] ?? ""} maxLength={1000} rows={3} onChange={(event) => setReasons((current) => ({ ...current, [item.id]: event.target.value }))} placeholder="Tell the organizer what needs to change" /></div>
                <div className="flex flex-wrap gap-2"><Button disabled={Boolean(busyId)} onClick={() => void review(item.id, "approve")}>{busyId === item.id ? "Reviewing…" : "Approve and publish"}</Button><Button disabled={Boolean(busyId)} variant="outline" onClick={() => void review(item.id, "reject")}>Reject</Button></div>
              </div>
            </EventCard>
          ))}</div> : <Card><CardContent className="empty-state"><ClipboardCheck size={30} strokeWidth={1.5} aria-hidden="true" /><h3>{fetchError ? "Queue unavailable" : "You’re all caught up"}</h3><p>{fetchError ? "Use Refresh queue to try loading the submissions again." : "There are no events waiting for your review. This queue checks for new submissions every 30 seconds."}</p></CardContent></Card>}
        </section><aside className="review-guide"><div className="panel-section-heading"><h2>Before you publish</h2><ShieldCheck size={19} aria-hidden="true" /></div><p>Every approval appears on the public event board immediately.</p><ul className="check-list"><li><Check size={16} aria-hidden="true" />Check the event name and description.</li><li><Check size={16} aria-hidden="true" />Review the poster and schedule.</li><li><Check size={16} aria-hidden="true" />Confirm the course and target year.</li></ul><div className="info-note">Something needs a change? Reject the submission with a clear reason so the organizer knows what to update.</div></aside></div>

        <section aria-labelledby="reviewed-title" id="reviewed"><div className="panel-section-heading"><h2 id="reviewed-title">Reviewed events</h2><span>{fetchError ? "Unavailable" : `${reviewed.length} events`}</span></div>{reviewed.length ? <div className="event-grid">{reviewed.map((item) => <EventCard key={item.id} event={item} imageUrl={imageUrls[item.id]} />)}</div> : <Card><CardContent className="empty-state compact-empty"><p>{fetchError ? "Reviewed events could not be loaded." : "Approved and rejected submissions will be recorded here."}</p></CardContent></Card>}</section>
    </WorkspaceShell>
  );
}
