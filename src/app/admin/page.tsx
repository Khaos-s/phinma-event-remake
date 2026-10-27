"use client";

import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ClipboardCheck, Clock3, CircleCheck, CircleX, Eye, Layers3, LockKeyhole, RefreshCw, ShieldCheck } from "lucide-react";
import { useAccount } from "@/components/auth-provider";
import { AdminEventEditor } from "@/components/admin-event-editor";
import { EventDetails } from "@/components/event-details";
import { EventStatus } from "@/components/event-status";
import { WorkspaceShell } from "@/components/workspace-shell";
import { LoadingPanel } from "@/components/loading-panel";
import { useFeedbackToasts } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { EVENT_SELECT, EventRow, IMAGE_BUCKET, formatPhilippineTime, signedImageUrls, yearLabel } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { roleHome } from "@/lib/roles";
import "./admin.css";

export default function AdminPage() {
  const client = useMemo(() => createClient(), []);
  const router = useRouter();
  const account = useAccount();
  const [editor, setEditor] = useState<EventRow | null | undefined>(undefined);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [fetchError, setFetchError] = useState("");
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected" | "all">("pending");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNow, setReviewNow] = useState(() => Date.now());
  const submissionsHeading = useRef<HTMLHeadingElement>(null);
  useFeedbackToasts(error, notice);

  const loadEvents = useCallback(async () => {
    const { data, error: loadError } = await client.rpc("workspace_events").select(EVENT_SELECT).order("created_at", { ascending: false });
    if (loadError) {
      setFetchError("The review queue could not be loaded. Please refresh the page.");
      return;
    }
    const rows = (data ?? []) as unknown as EventRow[];
    setFetchError("");
    setReviewNow(Date.now());
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
    try {
      const { error: reviewError } = action === "approve"
        ? await client.rpc("approve_event", { event_id: eventId })
        : await client.rpc("reject_event", { event_id: eventId, reason });
      if (reviewError) {
        setError("Review failed. The event may have already been reviewed; refresh and try again.");
      } else {
        setNotice(action === "approve" ? "Event approved and published." : "Event rejected; the organizer can see your reason.");
        await loadEvents();
        submissionsHeading.current?.focus({ preventScroll: true });
      }
    } catch { setError("The review result could not be confirmed. Refresh the events before trying again."); }
    finally { setBusyId(""); }
  }

  async function deleteEvent(event: EventRow) {
    if (busyId || !window.confirm(`Delete “${event.title}”? This permanently removes the event from the website.`)) return;
    setBusyId(event.id); setError(""); setNotice("");
    try {
      const result = await client.rpc("admin_delete_event", { event_id: event.id, expected_updated_at: event.updated_at });
      if (result.error) { setError(`The deletion could not be confirmed. Refresh before retrying. ${result.error.message}`); return; }
      setNotice("Event deleted.");
      if (result.data && (await client.storage.from(IMAGE_BUCKET).remove([result.data])).error) setError("The event was deleted, but its unused poster could not be removed.");
      await loadEvents();
      submissionsHeading.current?.focus({ preventScroll: true });
    } catch { setError("Deletion or poster cleanup could not be confirmed. Refresh events before retrying."); }
    finally { setBusyId(""); }
  }

  if (account.error) return <WorkspaceShell title="Manage events"><p className="form-error" role="alert">{account.error}</p></WorkspaceShell>;
  if (loading || account.loading || account.role !== "event_admin") return <WorkspaceShell title="Manage events"><LoadingPanel>Checking administrator access…</LoadingPanel></WorkspaceShell>;

  if (editor !== undefined) return <WorkspaceShell title="Manage events"><AdminEventEditor key={editor?.id ?? "new"} event={editor} now={reviewNow} imageUrl={editor ? imageUrls[editor.id] : undefined} onCancel={() => { setEditor(undefined); requestAnimationFrame(() => submissionsHeading.current?.focus({ preventScroll: true })); }} onSaved={async (message, cleanupError) => { setEditor(undefined); setNotice(message); setError(cleanupError); setFilter("all"); await loadEvents(); submissionsHeading.current?.focus({ preventScroll: true }); }} /></WorkspaceShell>;

  const pending = events.filter((item) => item.status === "pending");
  const reviewed = events.filter((item) => item.status !== "pending");
  const published = events.filter((item) => item.status === "approved").length;
  const visible = filter === "all" ? events : events.filter(item => item.status === filter);
  const filters = [{ value: "pending", label: "Pending", icon: Clock3 }, { value: "approved", label: "Published", icon: CircleCheck }, { value: "rejected", label: "Rejected", icon: CircleX }, { value: "all", label: "All", icon: Layers3 }] as const;

  return (
    <WorkspaceShell title="Manage events">
        <div className="page-heading admin-page-heading">
          <div><p className="eyebrow">Campus publishing desk</p><h1>Manage events</h1><p>Review the details. Give the next campus moment the green light.</p></div>
          <div className="admin-page-actions"><Button onClick={() => setEditor(null)}>Create event</Button><Link href="/admin/users" className="text-link">Register organizer</Link><Button variant="outline" onClick={() => void loadEvents()}><RefreshCw size={15} aria-hidden="true" />Refresh queue</Button></div>
        </div>
        <div className="summary-strip"><div><span>Awaiting review</span><strong>{fetchError ? "—" : pending.length}</strong></div><div><span>Published</span><strong>{fetchError ? "—" : published}</strong></div><div><span>Rejected</span><strong>{fetchError ? "—" : reviewed.length - published}</strong></div></div>
        {(error || fetchError) && <p role="alert" className="form-error">{error || fetchError}</p>}
        {notice && <p role="status" className="success-notice"><Check size={17} aria-hidden="true" />{notice}</p>}

        <section className="admin-review-desk" aria-labelledby="submissions-title">
          <div className="admin-desk-heading"><div><h2 id="submissions-title" tabIndex={-1} ref={submissionsHeading}>Event submissions</h2><p>Inspect the full announcement and poster before making a decision.</p></div><span role="status">{fetchError ? "Unavailable" : `${visible.length} events`}</span></div>
          <div className="admin-status-filters event-tabs" role="group" aria-label="Submission status">{filters.map(({ value, label, icon: Icon }) => <button key={value} type="button" className={filter === value ? "selected" : ""} aria-pressed={filter === value} onClick={() => setFilter(value)}><Icon size={16} aria-hidden="true" />{label}</button>)}</div>
          {visible.length ? <table className="admin-review-table" role="table">
            <caption className="sr-only">Event submissions, publisher and audience, Philippine schedule, review status, and administrator decisions</caption>
            <colgroup><col className="admin-proposal-column" /><col className="admin-publisher-column" /><col className="admin-schedule-column" /><col className="admin-status-column" /><col className="admin-decision-column" /></colgroup>
            <thead role="rowgroup"><tr role="row"><th scope="col" role="columnheader">Proposal</th><th scope="col" role="columnheader">Publisher &amp; audience</th><th scope="col" role="columnheader">Schedule · PHT</th><th scope="col" role="columnheader">Status</th><th scope="col" role="columnheader">Review &amp; decision</th></tr></thead>
            <tbody role="rowgroup">{visible.map(item => <Fragment key={item.id}>
              <tr className="admin-review-row" role="row">
                <th scope="row" role="rowheader" className="admin-proposal-cell"><span className="admin-mobile-label" aria-hidden="true">Proposal</span><h3>{item.title}</h3><p className="admin-proposal-excerpt">{item.description}</p><Button type="button" variant="ghost" className="admin-inspect-button" aria-expanded={expandedId === item.id} aria-controls={expandedId === item.id ? `submission-detail-${item.id}` : undefined} onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}><Eye size={16} aria-hidden="true" />{expandedId === item.id ? "Close inspection" : "Inspect submission"}<ChevronDown size={14} aria-hidden="true" /></Button><div className="admin-row-actions"><Button variant="outline" disabled={Boolean(busyId)} onClick={() => setEditor(item)}>Edit event</Button><Button variant="outline" disabled={Boolean(busyId)} onClick={() => void deleteEvent(item)}>Delete event</Button></div></th>
                <td role="cell"><span className="admin-mobile-label" aria-hidden="true">Publisher &amp; audience</span><strong className="admin-publisher-name">{item.organization?.name ?? "Publisher unavailable"}</strong><p>{item.department}</p><p className="admin-audience">{item.course} · {yearLabel(item.target_year)}</p></td>
                <td role="cell" className="admin-schedule-cell"><span className="admin-mobile-label" aria-hidden="true">Schedule · PHT</span><time dateTime={item.starts_at}>{formatPhilippineTime(item.starts_at)}</time><span className="admin-schedule-to">to</span><time dateTime={item.ends_at}>{formatPhilippineTime(item.ends_at)}</time><small>Philippine time</small></td>
                <td role="cell"><span className="admin-mobile-label" aria-hidden="true">Status</span><EventStatus status={item.status} /></td>
                <td role="cell" className="admin-decision-cell"><span className="admin-mobile-label" aria-hidden="true">Review &amp; decision</span>{item.status === "pending" ? <div className="admin-decision-form">
                  <Label htmlFor={`reason-${item.id}`}>Reason if rejecting</Label><Textarea id={`reason-${item.id}`} value={reasons[item.id] ?? ""} maxLength={1000} rows={2} disabled={Boolean(busyId)} onChange={event => setReasons(current => ({ ...current, [item.id]: event.target.value }))} placeholder="What needs to change?" />
                  <div className="admin-decision-actions"><Button disabled={Boolean(busyId)} loading={busyId === item.id} onClick={() => void review(item.id, "approve")}><Check size={15} aria-hidden="true" />{busyId === item.id ? "Reviewing…" : "Approve and publish"}</Button><Button disabled={Boolean(busyId)} variant="outline" onClick={() => void review(item.id, "reject")}><CircleX size={15} aria-hidden="true" />Reject</Button></div>
                </div> : <div className="admin-locked-decision"><p><LockKeyhole size={14} aria-hidden="true" />Review complete</p><span>{item.status === "approved" ? "Published on the event board. This decision is locked." : "Returned to the organizer. A new review requires resubmission."}</span>{item.status === "rejected" && <p className="rejection-note"><strong>Review note:</strong> {item.rejection_reason}</p>}</div>}</td>
              </tr>
              {expandedId === item.id && <tr className="admin-inspection-row" role="row"><td colSpan={5} role="cell"><section id={`submission-detail-${item.id}`} aria-label={`Full submission: ${item.title}`} className="admin-inspection"><div className="admin-inspection-heading"><ShieldCheck size={18} aria-hidden="true" /><p>Review the full description, poster, schedule, and audience. Approval publishes this announcement.</p></div><EventDetails event={item} imageUrl={imageUrls[item.id]} now={reviewNow} preview showActions={false} /></section></td></tr>}
            </Fragment>)}</tbody>
          </table> : <Card><CardContent className="empty-state"><ClipboardCheck size={30} strokeWidth={1.5} aria-hidden="true" /><h3>{fetchError ? "Queue unavailable" : filter === "pending" ? "You’re all caught up" : "No submissions in this view"}</h3><p>{fetchError ? "Use Refresh queue to try loading the submissions again." : filter === "pending" ? "There are no events waiting for your review. This queue checks for new submissions every 30 seconds." : "Choose another status to see the other submissions."}</p></CardContent></Card>}
          <p className="admin-desk-note"><ShieldCheck size={16} aria-hidden="true" /><span>Approval publishes immediately. Rejections need a clear note for the organizer. The queue checks for new submissions every 30 seconds.</span></p>
        </section>

    </WorkspaceShell>
  );
}
