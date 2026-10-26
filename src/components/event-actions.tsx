"use client";

import Link from "next/link";
import { useState } from "react";
import { CalendarPlus, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PublicEvent } from "@/lib/events";
import { eventCalendar } from "@/lib/calendar";

export function EventActions({ event }: { event: PublicEvent }) {
  const [message, setMessage] = useState("");
  const [copyLink, setCopyLink] = useState("");
  const [sharing, setSharing] = useState(false);

  function addToCalendar() {
    try {
      const url = URL.createObjectURL(new Blob([eventCalendar(event)], { type: "text/calendar;charset=utf-8" }));
      const link = document.createElement("a");
      link.href = url; link.download = `phinma-event-${event.id}.ics`;
      document.body.append(link); link.click(); link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      setMessage("Calendar file downloaded. Open it in your calendar to add this event.");
    } catch { setMessage("The calendar file could not be created. Please try again."); }
  }

  async function share() {
    const url = new URL(`/events/${event.id}`, window.location.origin).href;
    setMessage(""); setCopyLink(""); setSharing(true);
    try {
      if (navigator.share) {
        try { await navigator.share({ title: event.title, text: event.title, url }); return; }
        catch (error) { if (error instanceof Error && error.name === "AbortError") return; }
      }
      if (!navigator.clipboard) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(url);
      setMessage("Link copied");
    } catch { setCopyLink(url); setMessage("Copy the event link below to share it."); }
    finally { setSharing(false); }
  }

  return <div className="public-actions"><div className="event-action-row"><Button type="button" variant="outline" onClick={addToCalendar}><CalendarPlus size={17} aria-hidden="true" />Add to calendar</Button><Button type="button" variant="outline" disabled={sharing} onClick={() => void share()}><Share2 size={17} aria-hidden="true" />{sharing ? "Sharing…" : "Share"}</Button><Link href="/events" className="text-link">Back to all events</Link></div><p className="action-feedback" role="status" aria-live="polite">{message}</p>{copyLink && <label className="manual-share">Event link<input type="url" readOnly value={copyLink} onFocus={event => event.target.select()} /></label>}</div>;
}
