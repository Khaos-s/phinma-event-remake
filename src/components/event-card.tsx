import { ArrowUpRight, CalendarDays, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventStatus } from "@/components/event-status";
import { EventRow, EventStage, formatPhilippineTime, yearLabel } from "@/lib/events";

export function EventCard({ event, imageUrl, stage, children, onPreview }: { event: EventRow; imageUrl?: string; stage?: EventStage; children?: React.ReactNode; onPreview?: () => void }) {
  return (
    <Card className={`event-card overflow-hidden ${onPreview ? "event-card-interactive" : ""}`} role="article">
      <div className="event-image">
      {imageUrl ? (
        // Signed Storage URLs expire; native loading avoids caching them in Next's image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`Poster for ${event.title}`} loading="lazy" />
      ) : <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Event image unavailable</div>}
      </div>
      <CardContent className="space-y-4 pt-6">
        <div>
          <div className="event-card-heading"><p className="event-department">{event.department} · {event.course}</p><EventStatus status={stage ?? event.status} /></div>
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
      </CardContent>
    </Card>
  );
}
