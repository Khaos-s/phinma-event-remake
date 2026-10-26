"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, LockKeyhole, X } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EventDetails } from "@/components/event-details";
import { eventStage, type PublicEvent } from "@/lib/events";

export type OrganizerPreview = { event: PublicEvent; imageUrl?: string; now: number; view: "card" | "details" };

export function OrganizerEventPreview({ preview, onClose }: { preview: OrganizerPreview; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const detailsTab = useRef<HTMLButtonElement>(null);
  const [view, setView] = useState(preview.view);
  const source = preview.event;
  const publicEvent: PublicEvent = {
    id: source.id, title: source.title, description: source.description,
    image_path: source.image_path, starts_at: source.starts_at, ends_at: source.ends_at,
    organization: source.organization, organization_id: source.organization_id,
    department: source.department, course: source.course, target_year: source.target_year, status: source.status,
  };
  useEffect(() => {
    returnFocus.current ??= document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const modal = dialog.current;
    modal?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (returnFocus.current?.isConnected) returnFocus.current.focus({ preventScroll: true });
    };
  }, []);

  return <dialog ref={dialog} className="event-preview organizer-event-preview" aria-labelledby="organizer-preview-title" onClose={event => { if (event.target === event.currentTarget) onClose(); }} onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={event => {
    if (event.key !== "Tab" || (event.target as HTMLElement).closest("dialog") !== event.currentTarget) return;
    const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], [tabindex="0"]')].filter(control => control.getClientRects().length > 0);
    const first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
    if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
  }}>
    <div className="preview-toolbar"><h2 id="organizer-preview-title">Event board preview</h2><button type="button" className="icon-button" aria-label="Close board preview" onClick={() => dialog.current?.close()} autoFocus><X size={20} aria-hidden="true" /></button></div>
    <p className="organizer-preview-note"><LockKeyhole size={16} aria-hidden="true" />Preview only. New and revised submissions appear publicly after administrator approval.</p>
    <div className="organizer-preview-switch event-tabs" role="group" aria-label="Preview format"><button type="button" aria-pressed={view === "card"} className={view === "card" ? "selected" : ""} onClick={() => setView("card")}>Event card</button><button ref={detailsTab} type="button" aria-pressed={view === "details"} className={view === "details" ? "selected" : ""} onClick={() => setView("details")}>Event details</button></div>
    {view === "card" ? <div className="organizer-card-canvas"><EventCard event={publicEvent} imageUrl={preview.imageUrl} stage={eventStage(publicEvent, preview.now)} onPreview={() => { setView("details"); detailsTab.current?.focus(); }} /></div> : <EventDetails event={publicEvent} imageUrl={preview.imageUrl} now={preview.now} preview showActions={false} />}
    <div className="preview-actions"><button type="button" className="text-link" onClick={() => dialog.current?.close()}>Back to workspace</button>{preview.event.status === "approved" && <Link href={`/events/${preview.event.id}`} className="text-link">View published event<ArrowUpRight size={16} aria-hidden="true" /></Link>}</div>
  </dialog>;
}
