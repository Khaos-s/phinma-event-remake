"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EventDetails } from "@/components/event-details";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { colleges } from "@/lib/academics";
import { EventRow, EventStage, eventStage, matchesEventFilters, signedImageUrls } from "@/lib/events";
import { createClient } from "@/lib/supabase/client";

const timeFilters: { value: EventStage | "all"; label: string }[] = [
  { value: "all", label: "All events" }, { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" }, { value: "past", label: "Past" },
];

export function EventBrowser({ home = false }: { home?: boolean }) {
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventRow[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<EventStage | "all">("all");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [department, setDepartment] = useState("all");
  const [course, setCourse] = useState("all");
  const [organizer, setOrganizer] = useState("all");
  const [selected, setSelected] = useState<EventRow | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
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

  useEffect(() => {
    if (!selected) { dialog.current?.close(); return; }
    const previousOverflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [selected]);

  const visible = events.filter((event) => matchesEventFilters(event, { stage: filter, year, query: search, department, course, organizer }, now));
  const courses = colleges.filter((college) => department === "all" || college.name === department).flatMap((college) => college.courses);
  const hasFilters = filter !== "all" || search || year !== "all" || department !== "all" || course !== "all" || organizer !== "all";
  function clearFilters() { setFilter("all"); setSearch(""); setYear("all"); setDepartment("all"); setCourse("all"); setOrganizer("all"); }

  return (
    <>
      <SiteHeader />
      <main id="main-content" className="page-container public-main">
        {home && <section className="board-hero" aria-labelledby="board-title">
          <div className="board-hero-copy"><span className="university-context">PHINMA University of Iloilo</span><h1 id="board-title">Campus events.<br /><span>For all of us.</span></h1><p>Find your next workshop, student initiative, or campus gathering. A shared calendar for our university community.</p><Link href="/events" className="primary-link">Explore all events<ArrowRight size={16} aria-hidden="true" /></Link></div>
          <div className="board-hero-photo"><Image src="/images/phinma-students.jpg" alt="PHINMA University of Iloilo students together on campus" fill sizes="(min-width: 900px) 40vw, 100vw" priority /><span>Our university. Your community.</span></div>
        </section>}
        <section id="events" className={home ? "event-section" : "event-directory"} aria-labelledby="events-title">
          <div className="section-heading"><div>{home ? <h2 id="events-title">Explore the event board</h2> : <h1 id="events-title">All events</h1>}<p>Discover events by department, course, organizer, and year level.</p></div>{home ? <Link href="/events" className="text-link">View all events<ArrowRight size={16} aria-hidden="true" /></Link> : <span className="calendar-timezone"><CalendarDays size={16} aria-hidden="true" />Philippine time · PHT</span>}</div>
          <div className="event-board-layout">
            <aside className="board-filters" aria-label="Event audience filters">
              <div className="panel-section-heading"><h3>Find your event</h3><SlidersHorizontal size={16} aria-hidden="true" /></div>
              <div className="filter-field"><label htmlFor="event-search">Search events</label><div className="event-search"><Search size={16} aria-hidden="true" /><input id="event-search" type="search" placeholder="Search by name or topic" value={search} onChange={(event) => setSearch(event.target.value)} /></div></div>
              <div className="filter-field"><label htmlFor="department-filter">Department</label><select id="department-filter" value={department} onChange={(event) => { setDepartment(event.target.value); setCourse("all"); }}>{["all", ...colleges.map((college) => college.name)].map((value) => <option key={value} value={value}>{value === "all" ? "All departments" : value}</option>)}</select></div>
              <div className="filter-field"><label htmlFor="course-filter">Course</label><select id="course-filter" value={course} onChange={(event) => setCourse(event.target.value)}><option value="all">All courses</option>{courses.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</select></div>
              <div className="filter-field"><label htmlFor="organizer-filter">Organizer</label><select id="organizer-filter" value={organizer} onChange={(event) => setOrganizer(event.target.value)}><option value="all">All organizers</option><option value="CITE Council">CITE Council</option></select></div>
              <div className="filter-field"><label htmlFor="year-filter">Year level</label><select id="year-filter" value={year} onChange={(event) => setYear(event.target.value)}><option value="all">All year levels</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
              <button type="button" className="clear-filters" onClick={clearFilters}>Reset filters</button>
            </aside>
            <div className="board-results">
              <div className="event-toolbar"><div className="event-tabs" role="group" aria-label="Filter events by time">{timeFilters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "selected" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><span className="event-result-count" role="status">{loading ? "Loading…" : error ? "Unavailable" : `${visible.length} ${visible.length === 1 ? "event" : "events"}`}</span></div>
              {loading ? <div className="loading-panel" role="status"><CalendarDays size={25} aria-hidden="true" /><p>Loading the campus calendar…</p></div> : error ? <p role="alert" className="form-error">{error}</p> : visible.length ? <div className="event-grid">{visible.map((event) => <EventCard key={event.id} event={event} imageUrl={imageUrls[event.id]} stage={eventStage(event, now)} onPreview={() => setSelected(event)} />)}</div> : <div className="calendar-empty"><CalendarDays size={32} strokeWidth={1.4} aria-hidden="true" /><h3>{hasFilters ? "No matching events" : "Your next campus moment is coming"}</h3><p>{hasFilters ? "Try a different search, department, course, organizer, or year level." : "Published events will appear here with their poster, schedule, and audience."}</p>{hasFilters && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}</div>}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <dialog ref={dialog} className="event-preview" aria-labelledby="event-preview-title" onClose={() => setSelected(null)} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => {
        if (event.key !== "Tab") return;
        const controls = event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href]');
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        {selected && <><div className="preview-toolbar"><span>Event quick view</span><button type="button" className="icon-button" aria-label="Close event preview" onClick={() => dialog.current?.close()} autoFocus><X size={20} /></button></div><EventDetails event={selected} imageUrl={imageUrls[selected.id]} now={now} preview /><div className="preview-actions"><button type="button" className="text-link" onClick={() => dialog.current?.close()}>Back to events</button><Link href={`/events/${selected.id}`} className="primary-link">View full details<ArrowRight size={16} aria-hidden="true" /></Link></div></>}
      </dialog>
    </>
  );
}
