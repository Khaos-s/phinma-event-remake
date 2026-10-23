"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { EventDetails } from "@/components/event-details";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventRow, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

export function EventDetailPage({ id }: { id: string }) {
  const client = useMemo(() => createClient(), []);
  const [event, setEvent] = useState<EventRow | null>(null);
  const [imageUrl, setImageUrl] = useState<string>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let active = true;
    async function load() {
      if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) { setLoading(false); return; }
      const { data, error: loadError } = await client.from("events").select("*").eq("id", id).eq("status", "approved").maybeSingle();
      if (!active) return;
      if (loadError) setError("This event could not be loaded. Please refresh to try again.");
      else {
        const row = data as EventRow | null;
        const urls = row ? await signedImageUrls(client, [row]) : {};
        if (!active) return;
        setEvent(row); setImageUrl(urls[id]); setError("");
      }
      setNow(Date.now()); setLoading(false);
    }
    void load();
    const timer = setInterval(() => void load(), 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [client, id]);

  return <><SiteHeader /><main id="main-content" className="page-container public-main event-detail-page"><Link href="/events" className="back-link"><ArrowLeft size={16} aria-hidden="true" />All events</Link>{loading ? <p className="loading-panel" role="status">Loading event details…</p> : error ? <p role="alert" className="form-error">{error}</p> : event ? <EventDetails event={event} imageUrl={imageUrl} now={now} /> : <section className="calendar-empty"><h1>Event not available</h1><p>This event does not exist or is not published.</p><Link className="primary-link" href="/events">Browse published events</Link></section>}</main><SiteFooter /></>;
}
