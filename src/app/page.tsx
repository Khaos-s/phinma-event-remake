"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CalendarDays, ShieldCheck } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EventRow, EventStage, eventStage, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

const filters: { value: EventStage; label: string }[] = [
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "past", label: "Past" },
];

export default function Home() {
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<EventStage>("upcoming");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = setInterval(() => setNow(Date.now()), 60_000);

    async function load() {
      const { data, error: loadError } = await client
        .from("events")
        .select("*")
        .eq("status", "approved")
        .order("starts_at", { ascending: true });
      if (!active) return;
      if (loadError) {
        setError("Events could not be loaded. Please try again later.");
      } else {
        const rows = (data ?? []) as EventRow[];
        setEvents(rows);
        setImageUrls(await signedImageUrls(client, rows));
      }
      if (active) setLoading(false);
    }

    void load();
    return () => { active = false; clearInterval(timer); };
  }, [client]);

  const visible = events.filter((event) => eventStage(event, now) === filter);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-border bg-[linear-gradient(135deg,#e9f5ee_0%,#f7faf6_55%,#e6f0e9_100%)]">
          <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-16 sm:px-6 md:grid-cols-[1.3fr_0.7fr] md:items-center md:py-24">
            <div className="max-w-2xl space-y-6">
              <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] text-primary"><CalendarDays className="size-3.5" aria-hidden="true" /> Campus events</span>
              <h1 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">Find what&apos;s happening at PHINMA University of Iloilo.</h1>
              <p className="max-w-xl text-base leading-7 text-muted-foreground">Explore CITE Council events approved by the PHINMA Event administration. Check what&apos;s coming up, happening now, or already finished.</p>
              <a href="#events" className="inline-flex items-center gap-2 font-semibold text-primary hover:underline">Explore events <ArrowRight className="size-4" aria-hidden="true" /></a>
            </div>
            <div className="rounded-3xl border border-primary/10 bg-white/80 p-8 shadow-[0_20px_60px_-40px_#14583d]">
              <div className="mb-6 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary"><ShieldCheck className="size-7" aria-hidden="true" /></div>
              <h2 className="text-xl font-semibold">Reviewed before it appears</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Every event on this page has been reviewed and approved by the PHINMA Event administrator.</p>
            </div>
          </div>
        </section>

        <section id="events" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 py-12 sm:px-6 sm:py-16">
          <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">CITE Council</p>
              <h2 className="text-3xl font-semibold tracking-tight">Events</h2>
              <p className="mt-2 text-sm text-muted-foreground">Times are shown in Philippine time.</p>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter events by time">
              {filters.map((item) => (
                <Button key={item.value} variant={filter === item.value ? "default" : "outline"} size="sm" aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</Button>
              ))}
            </div>
          </div>

          {loading ? <p role="status" className="text-sm text-muted-foreground">Loading events…</p> : error ? <p role="alert" className="text-sm text-destructive">{error}</p> : visible.length ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visible.map((event) => <EventCard key={event.id} event={event} imageUrl={imageUrls[event.id]} />)}
            </div>
          ) : (
            <Card className="border-dashed bg-card/70"><CardContent className="py-14 text-center"><CalendarDays className="mx-auto mb-4 size-8 text-primary" aria-hidden="true" /><h3 className="text-lg font-semibold">No {filter} events yet</h3><p className="mt-2 text-sm text-muted-foreground">Check another tab or come back soon.</p></CardContent></Card>
          )}
        </section>
      </main>
      <footer className="border-t border-border bg-card px-4 py-6 text-center text-xs text-muted-foreground">PHINMA Event · University of Iloilo</footer>
    </>
  );
}
