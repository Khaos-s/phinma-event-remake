import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { PublicEvent } from "@/lib/events";
import { ongoingApproved } from "@/lib/public-events";

export function HappeningNow({ events, now, loading, error, onUpcoming }: { events: PublicEvent[]; now: number; loading: boolean; error: string; onUpcoming: () => void }) {
  const live = ongoingApproved(events, now);
  return <section className="page-container happening-section" aria-labelledby="happening-title" data-reveal>
    <div className="happening-heading"><h2 id="happening-title">Happening now</h2><span>Across our campus</span></div>
    <div aria-live="polite">{loading ? <p className="live-empty" role="status">Checking live events…</p> : error ? <p className="live-empty">Live events are unavailable. Refresh to try again.</p> : live.length ? <ul className="happening-list">{live.map(event => <li key={event.id}><span className="live-label"><span className="live-dot" aria-hidden="true" />Live now</span><Link href={`/events/${event.id}`}>{event.title}<ArrowRight size={16} aria-hidden="true" /></Link><p>{event.department}</p><span className="live-end">Ends at {new Intl.DateTimeFormat("en-PH", { hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "Asia/Manila" }).format(new Date(event.ends_at))} PHT</span></li>)}</ul> : <p className="live-empty">Nothing is happening right now. <a href="#events" onClick={onUpcoming}>See what’s coming up.<ArrowRight size={15} aria-hidden="true" /></a></p>}</div>
  </section>;
}
