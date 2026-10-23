"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, GraduationCap, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { EventRow, EventStage, eventStage, matchesEventFilters, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

const filters: { value: EventStage | "all"; label: string }[] = [
  { value: "all", label: "All events" },
  { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" },
  { value: "past", label: "Past" },
];

export default function Home() {
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<EventStage | "all">("all");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      const { data, error: loadError } = await client.from("events").select("*")
        .eq("status", "approved").order("starts_at", { ascending: true });
      if (!active) return;
      if (loadError) setError("Events could not be loaded. Please refresh the page to try again.");
      else {
        const rows = (data ?? []) as EventRow[];
        const urls = await signedImageUrls(client, rows);
        if (!active) return;
        setEvents(rows);
        setImageUrls(urls);
        setError("");
      }
      if (active) setLoading(false);
    }
    void load();
    const timer = setInterval(() => { setNow(Date.now()); void load(); }, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [client]);

  const visible = events.filter((event) => matchesEventFilters(event, { stage: filter, year, query: search }, now));
  function clearFilters() { setFilter("all"); setSearch(""); setYear("all"); }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-container public-main">
        <section className="board-hero" aria-labelledby="board-title">
          <div className="board-hero-copy"><span className="university-context">PHINMA University of Iloilo</span><h1 id="board-title">Campus events.<br /><span>For all of us.</span></h1><p>Find your next workshop, council initiative, or campus gathering. A shared calendar for our university community.</p><a href="#events" className="primary-link">Find an event<ArrowRight size={16} aria-hidden="true" /></a></div>
          <div className="board-hero-photo"><Image src="/images/phinma-students.jpg" alt="PHINMA University of Iloilo students together on campus" fill sizes="(min-width: 900px) 40vw, 100vw" priority /><span>Our university. Your community.</span></div>
        </section>

        <div className="board-announcement"><ShieldCheck size={19} aria-hidden="true" /><p>Every event here has been reviewed and approved by the PHINMA Event administrator.</p><Link href="/login">Organizing an event?<ArrowRight size={15} aria-hidden="true" /></Link></div>

        <section id="events" className="event-section" aria-labelledby="events-title">
          <div className="section-heading"><div><h2 id="events-title">Explore the event board</h2><p>See what’s next, what’s happening, and what you’ve been part of.</p></div><span className="calendar-timezone"><CalendarDays size={16} aria-hidden="true" />Philippine time · PHT</span></div>
          <div className="event-board-layout">
            <aside className="board-filters" aria-label="Event audience filters"><div className="panel-section-heading"><h3>Find your event</h3><SlidersHorizontal size={16} aria-hidden="true" /></div><div className="filter-field"><label htmlFor="event-search">Search events</label><div className="event-search"><Search size={16} aria-hidden="true" /><input id="event-search" type="search" aria-label="Search events" placeholder="Search by name or topic" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div><div className="filter-field"><label htmlFor="year-filter">Year level</label><select id="year-filter" aria-label="Filter events by year level" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All year levels</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div><div className="department-filter"><GraduationCap size={18} aria-hidden="true" /><div><strong>CITE Council</strong><span>BS Information Technology</span></div></div><p className="field-hint">The first release features CITE Council events for BSIT students.</p><button type="button" className="clear-filters" onClick={clearFilters}>Reset filters</button></aside>
            <div className="board-results"><div className="event-toolbar"><div className="event-tabs" role="group" aria-label="Filter events by time">{filters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "selected" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><span className="event-result-count" role="status">{loading ? "Loading…" : error ? "Unavailable" : `${visible.length} ${visible.length === 1 ? "event" : "events"}`}</span></div>
              {loading ? <div className="loading-panel" role="status"><CalendarDays size={25} aria-hidden="true" /><p>Loading the campus calendar…</p></div> : error ? <p role="alert" className="form-error">{error}</p> : visible.length ? <div className="event-grid">{visible.map((event) => <EventCard key={event.id} event={event} imageUrl={imageUrls[event.id]} stage={eventStage(event, now)} />)}</div> : <div className="calendar-empty"><CalendarDays size={32} strokeWidth={1.4} aria-hidden="true" /><h3>{events.length ? "No matching events" : "Your next campus moment is coming"}</h3><p>{events.length ? "Try a different search, time, or year level." : "Once a CITE Council event is approved, you’ll find its details, poster, and schedule right here."}</p>{(filter !== "all" || search || year !== "all") && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}</div>}
              <div className="board-guide"><h3>One submission. One approval.</h3><p>Council organizers create an event, the administrator reviews it, and approval publishes it to this board. Students can browse without signing in.</p><Link href="/login" className="text-link">Go to your account<ArrowRight size={15} aria-hidden="true" /></Link></div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
