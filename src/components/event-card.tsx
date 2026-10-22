import { CalendarDays, GraduationCap } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { EventRow, formatPhilippineTime, yearLabel } from "@/lib/events";

export function EventCard({ event, imageUrl, children }: { event: EventRow; imageUrl?: string; children?: React.ReactNode }) {
  return (
    <Card className="overflow-hidden">
      {imageUrl ? (
        // Signed Storage URLs expire; native loading avoids caching them in Next's image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={`Poster for ${event.title}`} className="aspect-[16/9] w-full object-cover" loading="lazy" />
      ) : <div className="flex aspect-[16/9] items-center justify-center bg-secondary text-sm text-muted-foreground">Event image unavailable</div>}
      <CardContent className="space-y-4 pt-6">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.15em] text-primary">{event.department} · {event.course}</p>
          <h2 className="text-xl font-semibold leading-snug">{event.title}</h2>
        </div>
        <p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{event.description}</p>
        <div className="space-y-2 border-t border-border pt-4 text-sm">
          <p className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><span>{formatPhilippineTime(event.starts_at)} – {formatPhilippineTime(event.ends_at)} PHT</span></p>
          <p className="flex items-center gap-2"><GraduationCap className="size-4 shrink-0 text-primary" aria-hidden="true" /><span>{yearLabel(event.target_year)}</span></p>
        </div>
        {children}
      </CardContent>
    </Card>
  );
}
