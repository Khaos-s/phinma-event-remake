import { eventStage, type PublicEvent } from "./events.ts";

export function eventDateTile(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return {
    day: new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("en", { timeZone: "Asia/Manila", month: "short" }).format(date),
  };
}

export function ongoingApproved(events: PublicEvent[], now: number) {
  return events.filter(event => event.status === "approved" && eventStage(event, now) === "ongoing")
    .sort((a, b) => Date.parse(a.ends_at) - Date.parse(b.ends_at));
}

export function chooseFeatured(events: PublicEvent[], now: number) {
  return ongoingApproved(events, now)[0] ?? events
    .filter(event => event.status === "approved" && Date.parse(event.starts_at) > now && Date.parse(event.ends_at) > Date.parse(event.starts_at))
    .sort((a, b) => Date.parse(a.starts_at) - Date.parse(b.starts_at))[0];
}

export function eventCountdown(startsAt: string, now: number) {
  const total = Math.ceil((Date.parse(startsAt) - now) / 60_000);
  if (!Number.isFinite(total) || total <= 0) return null;
  return { days: Math.floor(total / 1440), hours: Math.floor(total % 1440 / 60), minutes: total % 60 };
}

export function relatedEvents(events: PublicEvent[], current: PublicEvent) {
  const others = events.filter(event => event.id !== current.id && event.status === "approved");
  const sameOrganizer = others.filter(event => event.organization_id === current.organization_id);
  return sameOrganizer.length
    ? { heading: "More from this organizer", events: sameOrganizer.slice(0, 3) }
    : { heading: "More in this department", events: others.filter(event => event.department === current.department).slice(0, 3) };
}
