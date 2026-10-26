"use client";

import { type CSSProperties, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUpRight, CalendarDays, Check, FileText, ImagePlus, LockKeyhole, Mail, MapPin, Phone, Search, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { EventCard } from "@/components/event-card";
import { EventDetails } from "@/components/event-details";
import { FeaturedEvent } from "@/components/featured-event";
import { HappeningNow } from "@/components/happening-now";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { collegeLabel, colleges } from "@/lib/academics";
import { PUBLIC_EVENT_SELECT, type EventStage, type PublicEvent, eventStage, matchesEventFilters, signedImageUrls } from "@/lib/events";
import { chooseFeatured } from "@/lib/public-events";
import { university } from "@/lib/site";
import { createClient } from "@/lib/supabase/client";

const timeFilters: { value: EventStage | "all"; label: string }[] = [
  { value: "all", label: "All events" }, { value: "upcoming", label: "Upcoming" },
  { value: "ongoing", label: "Ongoing" }, { value: "past", label: "Past" },
];

const palette = [
  ["Canvas", "#F4F6F2"], ["Surface", "#FFFFFF"], ["Ink", "#1D3027"],
  ["PHINMA green", "#006341"], ["Forest", "#004E35"], ["Gold", "#F4C62B"],
  ["Sage", "#E8F0E7"], ["Sage ink", "#164C35"], ["Muted", "#EFF2EC"],
  ["Secondary ink", "#58655B"], ["Border", "#DFE5DA"], ["Error", "#B22626"],
];

function Screen({ id, number, title, detail, children, className = "" }: { id: string; number: string; title: string; detail: string; children: ReactNode; className?: string }) {
  return <section id={id} className={`showcase-screen ${className}`} aria-labelledby={`${id}-title`}>
    <div className="showcase-screen-label"><div><span aria-hidden="true">{number}</span><h2 id={`${id}-title`}>{title}</h2></div><p>{detail}</p></div>
    <div className="showcase-screen-canvas" data-ui>{children}</div>
  </section>;
}

function PublicState({ loading, error, title, children }: { loading: boolean; error: string; title: string; children: ReactNode }) {
  return <div className={`showcase-empty ${error ? "showcase-empty-error" : ""}`} role={error ? "alert" : "status"}>
    <CalendarDays size={28} strokeWidth={1.4} aria-hidden="true" /><h3>{loading ? "Opening the event board…" : error ? "The event board is unavailable" : title}</h3>
    <p>{loading ? "Loading approved campus announcements." : error || children}</p>
  </div>;
}

export function SiteShowcase() {
  const client = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState("all");
  const [stage, setStage] = useState<EventStage | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposalStep, setProposalStep] = useState<"details" | "review">("details");
  const detailsHeading = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error: requestError } = await client.from("events").select(PUBLIC_EVENT_SELECT).eq("status", "approved").order("starts_at", { ascending: true });
        if (requestError) throw requestError;
        const rows = (data ?? []) as unknown as PublicEvent[];
        const urls = await signedImageUrls(client, rows);
        if (!active) return;
        setEvents(rows);
        setImageUrls(urls);
        setError("");
      } catch {
        if (active) setError("Approved events could not be loaded. Refresh the page to try again.");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    const timer = setInterval(() => { setNow(Date.now()); void load(); }, 60_000);
    return () => { active = false; clearInterval(timer); };
  }, [client]);

  const featured = !loading && !error ? chooseFeatured(events, now) : undefined;
  const visible = events.filter(event => matchesEventFilters(event, { stage, year: "all", query: search, department }, now));
  const selected = events.find(event => event.id === selectedId) ?? featured ?? events[0];

  function previewEvent(event: PublicEvent) {
    setSelectedId(event.id);
    detailsHeading.current?.focus();
    detailsHeading.current?.scrollIntoView({ block: "start" });
  }

  return <>
    <SiteHeader />
    <main id="main-content" className="showcase-page">
      <div className="showcase-intro">
        <div className="showcase-intro-top"><p className="showcase-preview-label"><span aria-hidden="true" />Platform design showcase</p><Link href="/" className="showcase-plain-link">Open the live experience<ArrowUpRight size={16} aria-hidden="true" /></Link></div>
        <div className="showcase-intro-copy"><div><p className="showcase-kicker">PHINMA University of Iloilo</p><h1>One campus.<br /><span>Every connection.</span></h1></div><div><p>An inside look at the event experience, from discovering your next campus moment to sharing one of your own.</p><a href="#showcase-navigation" className="showcase-plain-link">Explore the screens<ArrowDown size={16} aria-hidden="true" /></a></div></div>
        <nav className="showcase-index" aria-label="Showcase screens"><a href="#showcase-campus">Discover</a><a href="#showcase-discovery">Browse</a><a href="#showcase-details">Event details</a><a href="#showcase-organizer">Organizer</a><a href="#showcase-admin">Review</a><a href="#showcase-campus-contact">Campus &amp; identity</a></nav>
      </div>

      <div className="showcase-grid">
        <Screen id="showcase-navigation" number="01" title="A familiar starting point" detail="Header & navigation" className="showcase-navigation">
          <div className="showcase-nav-preview"><Link href="/" className="showcase-mini-brand"><span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" /><span>PHINMA UI Event<small>University of Iloilo</small></span></Link><nav aria-label="Preview page navigation"><Link href="/events">All events</Link><Link href="/contact">Contact</Link><a href={university.website} target="_blank" rel="noreferrer">Our university<ArrowUpRight size={13} aria-hidden="true" /></a></nav><Link href="/login" className="primary-link">Sign in<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <div className="showcase-nav-note"><span>Public browsing. One shared sign-in.</span><span>Desktop to pocket-sized.</span></div>
        </Screen>

        <Screen id="showcase-campus" number="02" title="Find your campus moment" detail="Home & search" className="showcase-campus">
          <div className="showcase-campus-hero"><div><span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" /><h3>PHINMA UI <em>Event</em></h3><p>University campus event platform</p><a href="#showcase-discovery">Discover your next campus moment<ArrowDown size={15} aria-hidden="true" /></a></div><div className="showcase-campus-photo"><Image src="/images/phinma-campus.jpg" alt="" fill sizes="(max-width: 720px) 100vw, 65vw" /></div></div>
          <form className="showcase-search" onSubmit={event => { event.preventDefault(); document.getElementById("showcase-discovery")?.scrollIntoView({ block: "start" }); }}>
            <div><label htmlFor="showcase-search">What interests you?</label><div className="showcase-input-icon"><Search size={17} aria-hidden="true" /><input id="showcase-search" type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search campus events" /></div></div>
            <div><label htmlFor="showcase-department">Department</label><select id="showcase-department" value={department} onChange={event => setDepartment(event.target.value)}><option value="all">All departments</option>{colleges.map(college => <option key={college.name} value={college.name}>{collegeLabel(college.name)}</option>)}</select></div>
            <Button type="submit" aria-label="Find events in the showcase"><Search size={16} aria-hidden="true" /><span>Find events</span></Button>
          </form>
          <p className="showcase-search-caption"><SlidersHorizontal size={14} aria-hidden="true" />Search and department filters update the discovery panel.<span>Asia/Manila · PHT</span></p>
        </Screen>

        <Screen id="showcase-spotlight" number="03" title="Right now. Up next." detail="Live & featured" className="showcase-spotlight">
          <HappeningNow events={events} now={now} loading={loading} error={error} onUpcoming={() => setStage("upcoming")} />
          {featured ? <FeaturedEvent event={featured} imageUrl={imageUrls[featured.id]} now={now} /> : <div className="showcase-spotlight-note"><span className="showcase-kicker">Campus spotlight</span><h3>{loading ? "Checking what’s next…" : error ? "Spotlight unavailable" : "The next spotlight is yours to discover."}</h3><p>{error ? "Refresh the page to load approved announcements." : "An upcoming or ongoing approved event appears here when available."}</p><Link href="/events" className="text-link">Visit the event board<ArrowRight size={15} aria-hidden="true" /></Link></div>}
        </Screen>

        <Screen id="showcase-discovery" number="04" title="An event for every interest" detail="Event discovery" className="showcase-discovery">
          <div id="events" className="showcase-panel-heading"><div><p className="showcase-kicker">The campus calendar</p><h3>Explore the event board</h3></div><Link href="/events" className="showcase-plain-link">View all<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
          <div className="showcase-filter-row"><div className="showcase-time-tabs" role="group" aria-label="Filter showcase events by time">{timeFilters.map(filter => <button key={filter.value} type="button" aria-pressed={stage === filter.value} onClick={() => setStage(filter.value)}>{filter.label}</button>)}</div><span role="status">{loading ? "Loading…" : error ? "Unavailable" : `${visible.length} ${visible.length === 1 ? "event" : "events"}`}</span></div>
          {loading || error || !visible.length ? <PublicState loading={loading} error={error} title={search || department !== "all" || stage !== "all" ? "No matching campus events" : "Good things are on the way"}>Approved events will appear here with their poster, schedule, and audience.</PublicState> : <div className="showcase-event-grid">{visible.slice(0, 2).map(event => <EventCard key={event.id} event={event} imageUrl={imageUrls[event.id]} stage={eventStage(event, now)} onPreview={() => previewEvent(event)} />)}</div>}
          <div className="showcase-discovery-bottom"><span>Only approved announcements appear publicly.</span>{(search || department !== "all" || stage !== "all") && <button type="button" className="text-link" onClick={() => { setSearch(""); setDepartment("all"); setStage("all"); }}>Reset filters</button>}</div>
        </Screen>

        <Screen id="showcase-details" number="05" title="The full picture" detail="Event details & poster" className="showcase-details">
          <div className="showcase-detail-top"><h3 ref={detailsHeading} tabIndex={-1}>Your event, in focus</h3><span>Public detail preview</span></div>
          {!loading && !error && selected ? <><EventDetails key={selected.id} event={selected} imageUrl={imageUrls[selected.id]} now={now} preview /><Link href={`/events/${selected.id}`} className="showcase-detail-link">Open the full event page<ArrowUpRight size={16} aria-hidden="true" /></Link></> : <PublicState loading={loading} error={error} title="Every detail in one place">Select a published event to explore its poster, Philippine schedule, audience, and announcement.</PublicState>}
          <div className="showcase-detail-features"><span><CalendarDays size={15} aria-hidden="true" />Philippine time</span><span><ArrowUpRight size={15} aria-hidden="true" />Shareable details</span><span><Search size={15} aria-hidden="true" />Full-size posters</span></div>
        </Screen>

        <Screen id="showcase-organizer" number="06" title="Bring people together" detail="Organizer workspace · read-only layout" className="showcase-organizer">
          <div className="showcase-workspace-bar"><span>PHINMA UI Event / Organizer</span><span><LockKeyhole size={13} aria-hidden="true" />Protected workspace</span></div>
          <div className="showcase-workspace-body"><div className="showcase-panel-heading"><div><p className="showcase-kicker">My events</p><h3>A good idea starts here.</h3></div><Link href="/organizer" className="showcase-plain-link">Open workspace<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
            <p className="showcase-layout-note">Two-step form layout. Switch the preview below; sign in with organizer access to create an event.</p>
            <div className="showcase-proposal-steps" role="group" aria-label="Organizer layout preview step"><button type="button" aria-pressed={proposalStep === "details"} onClick={() => setProposalStep("details")}><span>1</span>Event details</button><ArrowRight size={15} aria-hidden="true" /><button type="button" aria-pressed={proposalStep === "review"} onClick={() => setProposalStep("review")}><span>2</span>Review &amp; submit</button></div>
            <div className="showcase-proposal-layout">{proposalStep === "details" ? <fieldset disabled className="showcase-proposal-fields"><legend className="sr-only">Event proposal layout preview, all controls disabled</legend><div><label htmlFor="showcase-proposal-title">Event title</label><input id="showcase-proposal-title" placeholder="Give your event a name" /></div><div><label htmlFor="showcase-proposal-description">Description</label><textarea id="showcase-proposal-description" rows={3} placeholder="What should your campus know?" /></div><div className="showcase-form-pair"><div><label htmlFor="showcase-proposal-start">Starts · PHT</label><input id="showcase-proposal-start" type="datetime-local" /></div><div><label htmlFor="showcase-proposal-end">Ends · PHT</label><input id="showcase-proposal-end" type="datetime-local" /></div></div><div className="showcase-form-pair"><div><label htmlFor="showcase-proposal-course">Course</label><select id="showcase-proposal-course"><option>Assigned department’s courses</option></select></div><div><label htmlFor="showcase-proposal-year">Target year</label><select id="showcase-proposal-year"><option>All college years</option></select></div></div><div><label htmlFor="showcase-proposal-poster">Event poster</label><input id="showcase-proposal-poster" type="file" accept="image/jpeg,image/png,image/webp" /></div><Button type="button" disabled>Continue to review<ArrowRight size={15} aria-hidden="true" /></Button></fieldset> : <div className="showcase-proposal-review"><p><LockKeyhole size={14} aria-hidden="true" />Step 2 · Private full-event preview</p><div className="showcase-proposal-full-preview"><div><ImagePlus size={32} strokeWidth={1.3} aria-hidden="true" /><span>Your complete poster</span></div><div><h4>Your event, ready for a closer look.</h4><p>The full title, Philippine schedule, audience, and announcement appear here after you complete your event details.</p><dl><div><dt>Schedule</dt><dd>From your event details</dd></div><div><dt>Audience</dt><dd>From your assigned department</dd></div></dl></div></div><p className="showcase-layout-note">This is an empty layout preview. Submission stays private until an administrator approves it.</p><div className="showcase-proposal-actions"><button type="button" className="text-link" onClick={() => setProposalStep("details")}>Back to details</button><Button type="button" disabled><FileText size={15} aria-hidden="true" />Submit for review</Button></div></div>}</div>
          </div>
        </Screen>

        <Screen id="showcase-admin" number="07" title="Ready for the campus" detail="Administrator review · read-only layout" className="showcase-admin">
          <div className="showcase-workspace-bar"><span>PHINMA UI Event / Administrator</span><ShieldCheck size={16} aria-label="Protected administrator workspace" /></div>
          <div className="showcase-workspace-body"><div className="showcase-panel-heading"><div><p className="showcase-kicker">Manage events</p><h3>A thoughtful final check.</h3></div></div><p className="showcase-layout-note">Read-only table layout. Submissions and review actions stay in the protected administrator workspace.</p><div className="showcase-review-tabs" aria-label="Review status layout"><span>Pending</span><span>Published</span><span>Rejected</span><span>All</span></div><div className="showcase-review-table"><table><caption className="sr-only">Administrator submission table layout; no private submissions are loaded.</caption><thead><tr><th scope="col">Announcement</th><th scope="col">Schedule</th><th scope="col">Review</th></tr></thead><tbody><tr><td colSpan={3}><ShieldCheck size={28} strokeWidth={1.4} aria-hidden="true" /><strong>Review begins after sign-in.</strong><p>Authorized administrators can read submissions and approve or reject pending events.</p></td></tr></tbody></table></div><div className="showcase-review-steps"><p><Check size={15} aria-hidden="true" />Approval publishes the event automatically.</p><p><FileText size={15} aria-hidden="true" />Rejection includes a note for the organizer.</p></div><Link href="/admin" className="primary-link">Open Manage events<ArrowUpRight size={15} aria-hidden="true" /></Link></div>
        </Screen>

        <Screen id="showcase-campus-contact" number="08" title="Rooted in our university" detail="Campus contact & visual identity" className="showcase-campus-contact">
          <div className="showcase-contact-layout"><div className="showcase-contact-preview"><span role="img" aria-label="PHINMA University of Iloilo" className="university-logo" /><h3>A shared calendar.<br /><span>A connected campus.</span></h3><p>PHINMA University of Iloilo</p><ul><li><MapPin size={17} aria-hidden="true" /><a href={university.maps} target="_blank" rel="noreferrer">{university.address}</a></li><li><Phone size={16} aria-hidden="true" /><a href={university.phoneLink}>{university.phone}</a></li><li><Mail size={17} aria-hidden="true" /><a href={`mailto:${university.email}`}>{university.email}</a></li></ul><Link href="/contact">Visit campus contact<ArrowUpRight size={16} aria-hidden="true" /></Link></div><div className="showcase-identity"><div className="showcase-type-sample"><p className="showcase-kicker">Our visual language</p><h3>Made for<br />campus life.</h3><p>Bricolage Grotesque <span>Headings with character.</span></p><p>DM Sans <span>Everyday clarity.</span></p></div><div className="showcase-palette" aria-label="Canonical PHINMA UI Event color palette">{palette.map(([label, color]) => <div key={color}><span style={{ "--swatch": color } as CSSProperties} /><p>{label}<small>{color}</small></p></div>)}</div></div></div>
        </Screen>
      </div>
      <div className="showcase-outro"><div><p>Eight views. One campus experience.</p><Link href="/email-template" className="showcase-plain-link">Password recovery email template<ArrowUpRight size={15} aria-hidden="true" /></Link></div><Link href="/events" className="primary-link">Explore the real event board<ArrowRight size={16} aria-hidden="true" /></Link></div>
    </main>
    <SiteFooter />
  </>;
}
