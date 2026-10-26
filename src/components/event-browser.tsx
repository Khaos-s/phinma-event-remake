"use client";

import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, CalendarDays, Search, SlidersHorizontal, X } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EventDetails } from "@/components/event-details";
import { FeaturedEvent } from "@/components/featured-event";
import { HappeningNow } from "@/components/happening-now";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { colleges, collegeLabel } from "@/lib/academics";
import { PUBLIC_EVENT_SELECT, PublicEvent, EventStage, eventStage, matchesEventFilters, signedImageUrls } from "@/lib/events";
import type { Organization } from "@/lib/roles";
import { createClient } from "@/lib/supabase/client";
import { chooseFeatured, relatedEvents } from "@/lib/public-events";
import { useScrollReveal } from "@/hooks/use-scroll-reveal";

const timeFilters: { value: EventStage | "all"; label: string }[] = [
  { value: "all", label: "All" }, { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" }, { value: "past", label: "Past" },
];

export function EventBrowser({ home = false }: { home?: boolean }) {
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<EventStage | "all">("all");
  const [search, setSearch] = useState("");
  const [year, setYear] = useState("all");
  const [department, setDepartment] = useState("all");
  const [course, setCourse] = useState("all");
  const [organizer, setOrganizer] = useState("all");
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selected, setSelected] = useState<PublicEvent | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const previewOrigin = useRef<HTMLElement | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const main = useRef<HTMLElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      const [eventResult, organizationResult] = await Promise.all([
        client.from("events").select(PUBLIC_EVENT_SELECT).eq("status", "approved").order("starts_at", { ascending: true }),
        client.from("organizations").select("id,name,department").order("name"),
      ]);
      if (!active) return;
      if (eventResult.error || organizationResult.error) setError("Events could not be loaded. Please refresh the page to try again.");
      else {
        const rows = (eventResult.data ?? []) as unknown as PublicEvent[];
        const urls = await signedImageUrls(client, rows);
        if (!active) return;
        setEvents(rows);
        setOrganizations(organizationResult.data ?? []);
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
    const contentRoot = main.current;
    dialog.current?.showModal();
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
      if (previewOrigin.current?.isConnected) previewOrigin.current.focus({ preventScroll: true });
      else contentRoot?.querySelector<HTMLElement>('.event-tabs button[aria-pressed="true"]')?.focus({ preventScroll: true });
    };
  }, [selected]);

  const visible = events.filter((event) => matchesEventFilters(event, { stage: filter, year, query: search, department, course, organizer }, now));
  const courses = colleges.filter((college) => department === "all" || college.name === department).flatMap((college) => college.courses);
  const hasFilters = filter !== "all" || search || year !== "all" || department !== "all" || course !== "all" || organizer !== "all";
  function clearFilters() { setFilter("all"); setSearch(""); setYear("all"); setDepartment("all"); setCourse("all"); setOrganizer("all"); }
  const featured = home && !loading && !error ? chooseFeatured(events, now) : undefined;
  const related = selected ? relatedEvents(events, selected) : null;
  const resultsKey = `${filter}:${search}:${department}:${course}:${year}:${organizer}:${visible.map(event => event.id).join(",")}`;
  useScrollReveal(main, `${loading}:${resultsKey}:${featured?.id}`);
  useEffect(() => {
    const motion = matchMedia("(prefers-reduced-motion: reduce)");
    if (motion.matches) return;
    const animation = main.current?.querySelector(".discovery-results")?.animate([{ opacity: .5, transform: "translateY(6px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 180, easing: "ease-out" });
    const cancel = () => { if (motion.matches) animation?.cancel(); };
    motion.addEventListener("change", cancel);
    return () => { animation?.cancel(); motion.removeEventListener("change", cancel); };
  }, [resultsKey]);
  function openPreview(event: PublicEvent) { previewOrigin.current = document.activeElement as HTMLElement; setSelected(event); }

  const searchForm = <form className={`page-container discovery-search ${home ? "campus-search" : "directory-search"}`} role="search" aria-label="Find campus events" onSubmit={event => { event.preventDefault(); document.getElementById("events")?.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth" }); }}>
    <div className="search-primary-fields">
      <div className="filter-field"><label className="sr-only" htmlFor="event-search">What interests you?</label><div className="event-search"><Search size={18} aria-hidden="true" /><input id="event-search" type="search" placeholder="Explore campus events" value={search} onChange={event => setSearch(event.target.value)} /></div></div>
      <Button type="submit"><Search size={16} aria-hidden="true" /><span>Find events</span></Button>
      <button type="button" className="filter-toggle" aria-controls="event-filter-controls" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={17} aria-hidden="true" />{filtersOpen ? "Hide filters" : "Show filters"}</button>
    </div>
    <div id="event-filter-controls" className="discovery-search-controls" data-open={filtersOpen}>
      <div className="search-audience-fields">
        <div className="filter-field"><label htmlFor="department-filter">Department</label><select id="department-filter" value={department} onChange={event => { setDepartment(event.target.value); setCourse("all"); }}><option value="all">All departments</option>{colleges.map(college => <option key={college.code} value={college.name}>{collegeLabel(college.name)}</option>)}</select></div>
        <div className="filter-field"><label htmlFor="year-filter">Year level</label><select id="year-filter" value={year} onChange={event => setYear(event.target.value)}><option value="all">All year levels</option><option value="1">1st Year</option><option value="2">2nd Year</option><option value="3">3rd Year</option><option value="4">4th Year</option></select></div>
        <div className="filter-field"><label htmlFor="course-filter">Course</label><select id="course-filter" value={course} onChange={event => setCourse(event.target.value)}><option value="all">All courses</option>{courses.map(item => <option key={item.code} value={item.code}>{item.code} · {item.name}</option>)}</select></div>
        <div className="filter-field"><label htmlFor="organizer-filter">Organizer</label><select id="organizer-filter" value={organizer} onChange={event => setOrganizer(event.target.value)}><option value="all">All organizers</option>{organizations.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      </div>
      <div className="search-secondary-row"><button type="button" className="clear-filters" onClick={clearFilters}>Reset filters</button><span className="search-timezone">All times in PHT</span></div>
    </div>
  </form>;

  return (
    <>
      <SiteHeader />
      <main ref={main} id="main-content" className="public-discovery">
        {home ? <section className="campus-hero" aria-labelledby="board-title">
          <div className="campus-hero-art" aria-hidden="true"><Image src="/images/phinma-campus.jpg" alt="" fill sizes="100vw" preload /></div>
          <div className="campus-hero-content">
            <div className="page-container campus-hero-inner"><div className="campus-hero-copy"><p className="campus-eyebrow">PHINMA University of Iloilo</p><div className="hero-identity"><Image src="/icon.png" alt="University of Iloilo crest" width={88} height={88} /><h1 id="board-title">PHINMA UI <span>Event</span></h1></div><p>Discover your next campus moment.</p></div></div>
            {searchForm}
          </div>
          <div className="page-container hero-board-footer"><p className="hero-board-note">A shared calendar. A connected campus.</p><a href="#events">Explore the event board<ArrowDown size={18} aria-hidden="true" /></a></div>
        </section> : searchForm}
        {home && <HappeningNow events={events} now={now} loading={loading} error={error} onUpcoming={() => setFilter("upcoming")} />}
        {featured && <FeaturedEvent event={featured} imageUrl={imageUrls[featured.id]} now={now} />}
        <section id="events" className={`page-container ${home ? "event-section" : "event-directory"}`} aria-labelledby="events-title">
          <div className="section-heading"><div>{home ? <h2 id="events-title">Explore the event board</h2> : <h1 id="events-title">All events</h1>}<p>Discover events by department, course, organizer, and year level.</p></div>{home ? <Link href="/events" className="text-link">View all events<ArrowRight size={16} aria-hidden="true" /></Link> : <span className="calendar-timezone"><CalendarDays size={16} aria-hidden="true" />Philippine time · PHT</span>}</div>
          <div className="college-filters" role="group" aria-label="Filter events by college"><button type="button" aria-pressed={department === "all"} onClick={() => { setDepartment("all"); setCourse("all"); }}>All colleges</button>{colleges.map(college => <button type="button" key={college.code} title={college.name} aria-label={collegeLabel(college.name)} aria-pressed={department === college.name} onClick={() => { setDepartment(college.name); setCourse("all"); }}>{college.code}</button>)}</div>
          <div className="event-board-layout">
            <div className="board-results">
              <div className="event-toolbar"><div className="event-tabs" role="group" aria-label="Filter events by time" style={{ "--active-tab": timeFilters.findIndex(item => item.value === filter) } as CSSProperties}>{timeFilters.map((item) => <button type="button" key={item.value} className={filter === item.value ? "selected" : ""} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}</button>)}</div><span className="event-result-count" role="status">{loading ? "Loading…" : error ? "Unavailable" : `${visible.length} ${visible.length === 1 ? "event" : "events"}`}</span></div>
              <div className="discovery-results">{loading ? <div className="event-grid skeleton-grid" role="status"><span className="sr-only">Loading the campus calendar…</span>{[0, 1, 2].map(index => <div key={index} className="event-skeleton" aria-hidden="true"><div /><span /><span /><span /></div>)}</div> : error ? <p role="alert" className="form-error">{error}</p> : visible.length ? <div className="event-grid">{visible.map((event) => <EventCard key={event.id} event={event} imageUrl={imageUrls[event.id]} stage={eventStage(event, now)} onPreview={() => openPreview(event)} />)}</div> : <div className="calendar-empty"><CalendarDays size={32} strokeWidth={1.4} aria-hidden="true" /><h3>{hasFilters ? "No matching events" : "Your next campus moment is coming"}</h3><p>{hasFilters ? "Try a different search, department, course, organizer, or year level." : "Published events will appear here with their poster, schedule, and audience."}</p>{hasFilters && <Button variant="outline" onClick={clearFilters}>Clear filters</Button>}</div>}</div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
      <dialog ref={dialog} className="event-preview" aria-labelledby="event-preview-title" onClose={(event) => { if (event.target === event.currentTarget) setSelected(null); }} onClick={(event) => { if (event.target === event.currentTarget) dialog.current?.close(); }} onKeyDown={(event) => {
        if (event.key !== "Tab" || (event.target as HTMLElement).closest("dialog") !== event.currentTarget) return;
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, [tabindex="0"]')].filter(control => control.getClientRects().length > 0);
        const first = controls[0]; const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }}>
        {selected && <><div className="preview-toolbar"><span>Event quick view</span><button type="button" className="icon-button" aria-label="Close event preview" onClick={() => dialog.current?.close()} autoFocus><X size={20} /></button></div><EventDetails event={selected} imageUrl={imageUrls[selected.id]} now={now} preview />{related && related.events.length > 0 && <section className="preview-related" aria-labelledby="preview-related-title"><h3 id="preview-related-title">{related.heading}</h3><ul>{related.events.map(item => <li key={item.id}><Link href={`/events/${item.id}`}>{item.title}<ArrowRight size={16} aria-hidden="true" /></Link></li>)}</ul></section>}<div className="preview-actions"><button type="button" className="text-link" onClick={() => dialog.current?.close()}>Back to events</button><Link href={`/events/${selected.id}`} className="primary-link">View full details<ArrowRight size={16} aria-hidden="true" /></Link></div></>}
      </dialog>
    </>
  );
}
