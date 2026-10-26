import { CalendarDays, GraduationCap, School } from "lucide-react";
import { EventStatus } from "@/components/event-status";
import { PosterViewer } from "@/components/poster-viewer";
import { EventActions } from "@/components/event-actions";
import { PublicEvent, eventStage, formatPhilippineTime, yearLabel } from "@/lib/events";
import { collegeLabel } from "@/lib/academics";

export function EventDetails({ event, imageUrl, now, preview = false, showActions = true }: { event: PublicEvent; imageUrl?: string; now: number; preview?: boolean; showActions?: boolean }) {
  return (
    <article className={`event-details ${preview ? "is-preview" : ""}`}>
      <div className="event-detail-poster">{imageUrl ? <PosterViewer imageUrl={imageUrl} title={event.title} /> : <p>Event image unavailable</p>}</div>
      <div className="event-detail-content">
        <EventStatus status={eventStage(event, now)} />
        {preview ? <h2 id="event-preview-title">{event.title}</h2> : <h1>{event.title}</h1>}
        <dl className="event-facts">
          <div><dt><CalendarDays size={17} aria-hidden="true" />Schedule</dt><dd><time dateTime={event.starts_at}>{formatPhilippineTime(event.starts_at)}</time><span>to <time dateTime={event.ends_at}>{formatPhilippineTime(event.ends_at)}</time></span><small>Philippine time · PHT</small></dd></div>
          <div><dt><School size={17} aria-hidden="true" />Department</dt><dd>{collegeLabel(event.department)}</dd></div>
          {event.organization && <div><dt><School size={17} aria-hidden="true" />Organizer</dt><dd>{event.organization.name}</dd></div>}
          <div><dt><GraduationCap size={17} aria-hidden="true" />Course</dt><dd>{event.course}</dd></div>
          <div><dt><GraduationCap size={17} aria-hidden="true" />Year level</dt><dd>{yearLabel(event.target_year)}</dd></div>
        </dl>
        <section aria-label="Event description"><h3>About this event</h3><p className="event-description">{event.description}</p></section>
        {showActions && <EventActions event={event} />}
      </div>
    </article>
  );
}
