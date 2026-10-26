import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { EventStatus } from "@/components/event-status";
import { eventStage, formatPhilippineTime, yearLabel, type PublicEvent } from "@/lib/events";
import { eventCountdown } from "@/lib/public-events";

export function FeaturedEvent({ event, imageUrl, now }: { event: PublicEvent; imageUrl?: string; now: number }) {
  const countdown = eventCountdown(event.starts_at, now);
  const announcement = countdown ? `${event.title} starts ${countdown.days ? `in ${countdown.days} days` : countdown.hours ? `in ${countdown.hours} hours` : "in less than an hour"}.` : `${event.title} is happening now.`;
  return <section className="page-container featured-section" aria-labelledby="featured-title" data-reveal>
    <div className="section-heading"><h2 id="featured-title">In the campus spotlight</h2><span className="calendar-timezone">Featured on your campus</span></div>
    <article className="featured-event"><div className="featured-poster">{imageUrl ?
      // Signed Storage URLs must stay out of the image optimizer cache.
      // eslint-disable-next-line @next/next/no-img-element
      <img src={imageUrl} alt={`Poster for ${event.title}`} loading="lazy" /> : <p>Event image unavailable</p>}</div>
      <div className="featured-copy"><EventStatus status={eventStage(event, now)} /><h3>{event.title}</h3><p className="featured-organizer">By {event.organization?.name}</p><p className="featured-schedule"><CalendarDays size={18} aria-hidden="true" /><span>{formatPhilippineTime(event.starts_at)} – {formatPhilippineTime(event.ends_at)} PHT</span></p><p>{event.department} · {event.course} · {yearLabel(event.target_year)}</p><p className="featured-description">{event.description}</p>
        {countdown && <div className="event-countdown" aria-hidden="true">{Object.entries(countdown).map(([unit, value]) => <span key={unit}><strong key={value} className="countdown-digit">{String(value).padStart(2, "0")}</strong><small>{unit}</small></span>)}</div>}
        <span className="sr-only" role="status" aria-live="polite">{announcement}</span><Link className="primary-link" href={`/events/${event.id}`}>View full details<ArrowUpRight size={17} aria-hidden="true" /></Link>
      </div>
    </article>
  </section>;
}
