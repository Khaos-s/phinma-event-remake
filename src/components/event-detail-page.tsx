"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { LoadingPanel } from "@/components/loading-panel";
import { EventDetails } from "@/components/event-details";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { PUBLIC_EVENT_SELECT, PublicEvent, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";
import { relatedEvents } from "@/lib/public-events";
import { eventStage } from "@/lib/events";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

export function EventDetailPage({ id }: { id: string }) {
  const client = useMemo(() => createClient(), []);
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [imageUrl, setImageUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [related, setRelated] = useState<{ heading: string; events: PublicEvent[] }>({ heading: "", events: [] });
  const [relatedImages, setRelatedImages] = useState<Record<string, string>>({});
  const [relatedError, setRelatedError] = useState("");
  const main = useRef<HTMLElement>(null);
  useScrollReveal(main, related.events.map(event => event.id).join(","));

  useEffect(() => {
    let active = true;
    async function load() {
      if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) { setLoading(false); return; }
      const { data, error: loadError } = await client.from("events").select(PUBLIC_EVENT_SELECT).eq("id", id).eq("status", "approved").maybeSingle();
      if (!active) return;
      if (loadError) setError("This event could not be loaded. Please refresh to try again.");
      else {
        const row = data as unknown as PublicEvent | null;
        const urls = row ? await signedImageUrls(client, [row]) : {};
        if (!active) return;
        setEvent(row); setImageUrl(urls[id]); setError("");
        if (row) {
          const result = await client.from("events").select(PUBLIC_EVENT_SELECT).eq("status", "approved").eq("department", row.department).neq("id", id).order("starts_at", { ascending: false });
          if (!active) return;
          if (result.error) { setRelatedError("Related events could not be loaded."); setRelated({ heading: "", events: [] }); }
          else {
            const group = relatedEvents((result.data ?? []) as unknown as PublicEvent[], row);
            const images = await signedImageUrls(client, group.events);
            if (!active) return;
            setRelated(group); setRelatedImages(images); setRelatedError("");
          }
        } else { setRelated({ heading: "", events: [] }); setRelatedError(""); }
      }
      setNow(Date.now()); setLoading(false);
    }
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [client, id]);

  return <><SiteHeader /><main ref={main} id="main-content" className="page-container public-main event-detail-page"><nav aria-label="Event navigation" className="event-page-navigation"><Link href="/events" className="back-link"><ArrowLeft size={16} aria-hidden="true" />All events</Link>{event && <div><a href="#event-information">Event details</a>{related.events.length > 0 && <a href="#related-title">Related events</a>}</div>}</nav>{loading ? <LoadingPanel>Loading event details…</LoadingPanel> : error ? <p role="alert" className="form-error">{error}</p> : event ? <><EventDetails event={event} imageUrl={imageUrl} now={now} headingId="event-information" />{relatedError && <p className="action-feedback" role="status">{relatedError}</p>}{related.events.length > 0 && <section className="related-events" aria-labelledby="related-title" data-reveal><div className="section-heading"><h2 id="related-title">{related.heading}</h2></div><div className="event-grid">{related.events.map(item => <EventCard key={item.id} event={item} imageUrl={relatedImages[item.id]} stage={eventStage(item, now)} href={`/events/${item.id}`} />)}</div></section>}</> : <section className="calendar-empty"><h1>Event not available</h1><p>This event does not exist or is not published.</p><Link className="primary-link" href="/events">Browse published events</Link></section>}</main><SiteFooter /></>;
}
