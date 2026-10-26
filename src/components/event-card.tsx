import { ArrowUpRight, CalendarDays, GraduationCap } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { EventStatus } from "@/components/event-status";
import { PosterViewer } from "@/components/poster-viewer";
import { PublicEvent, EventStage, formatPhilippineTime, yearLabel } from "@/lib/events";
import { eventDateTile } from "@/lib/public-events";
import { colleges } from "@/lib/academics";

export function EventCard({ event, imageUrl, stage, children, onPreview, href, zoomPoster = false }: { event: PublicEvent & { rejection_reason?: string | null }; imageUrl?: string; stage?: EventStage; children?: React.ReactNode; onPreview?: () => void; href?: string; zoomPoster?: boolean }) {
  const date = onPreview || href ? eventDateTile(event.starts_at) : null;
  return (
    <Card className={`event-card overflow-hidden ${onPreview || href ? "event-card-interactive" : ""}`} role="article" data-reveal={onPreview || href ? "" : undefined}>
      <div className={zoomPoster ? "event-detail-poster" : "event-image"}>
      {imageUrl && zoomPoster ? <PosterViewer imageUrl={imageUrl} title={event.title} /> : imageUrl ? (
        // Signed Storage URLs expire; native loading avoids caching them in Next's image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`Poster for ${event.title}`} loading="lazy" />
      ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Event image unavailable</div>}
      {date && <time className="event-date-tile" dateTime={event.starts_at} aria-label={`${date.day} ${date.month}, Philippine time`}><strong>{date.day}</strong><span>{date.month}</span></time>}
      </div>
      <CardContent className="space-y-4 pt-6">
        <div>
          <div className="event-card-heading"><p className="event-department" title={event.department}>{colleges.find(item => item.name === event.department)?.code ?? event.department} · {event.course}</p><EventStatus status={stage ?? event.status} /></div>
          <h3>{event.title}</h3>
          {event.organization && <p className="event-organizer">By {event.organization.name}</p>}
        </div>
        <p className="event-description">{event.description}</p>
        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{formatPhilippineTime(event.starts_at)} – {formatPhilippineTime(event.ends_at)} PHT</span></p>
          <p className="flex items-center gap-2"><GraduationCap className="size-4 shrink-0 text-primary" aria-hidden="true" /><span>{yearLabel(event.target_year)}</span></p>
        </div>
        {!children && event.status === "rejected" && event.rejection_reason && <p className="rejection-note"><strong>Review note:</strong> {event.rejection_reason}</p>}
        {children}
        {onPreview && <button type="button" className="event-open" aria-label={`Preview ${event.title}`} onClick={onPreview}>View event<ArrowUpRight size={16} aria-hidden="true" /></button>}
        {href && <Link href={href} className="event-open" aria-label={`View ${event.title}`}>View event<ArrowUpRight size={16} aria-hidden="true" /></Link>}
      </CardContent>
    </Card>
  );
}
