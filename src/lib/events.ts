import type { SupabaseClient } from "@supabase/supabase-js";
import type { Organization } from "./roles.ts";

export const IMAGE_BUCKET = "event-images";
export const EVENT_SELECT = "*,organization:organizations(id,name,department)";
export const PUBLIC_EVENT_SELECT = "id,organization_id,title,description,image_path,starts_at,ends_at,department,course,target_year,status,organization:organizations(id,name,department)";

export type EventRow = {
  id: string;
  created_by: string;
  organization_id: string;
  organization: Organization;
  title: string;
  description: string;
  image_path: string;
  starts_at: string;
  ends_at: string;
  department: string;
  course: string;
  target_year: number | null;
  status: "pending" | "approved" | "rejected";
  rejection_reason: string | null;
  created_at: string;
};

export type EventStage = "upcoming" | "ongoing" | "past";
export type PublicEvent = Omit<EventRow, "created_by" | "created_at" | "rejection_reason">;

export function matchesEventFilters(
  event: Pick<EventRow, "starts_at" | "ends_at" | "target_year" | "title" | "description" | "course" | "department" | "organization_id">,
  filters: { stage: EventStage | "all"; year: string; query: string; department?: string; course?: string; organizer?: string },
  now: number,
) {
  return (filters.stage === "all" || eventStage(event, now) === filters.stage)
    && (filters.year === "all" || event.target_year === null || event.target_year === Number(filters.year))
    && (!filters.department || filters.department === "all" || event.department === filters.department)
    && (!filters.course || filters.course === "all" || event.course === filters.course)
    && (!filters.organizer || filters.organizer === "all" || event.organization_id === filters.organizer)
    && `${event.title} ${event.description} ${event.course} ${event.department}`.toLowerCase().includes(filters.query.trim().toLowerCase());
}

export function eventStage(event: Pick<EventRow, "starts_at" | "ends_at">, now: number): EventStage {
  if (now < Date.parse(event.starts_at)) return "upcoming";
  if (now < Date.parse(event.ends_at)) return "ongoing";
  return "past";
}

export function philippineTimeToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const time = new Date(`${value}+08:00`);
  if (Number.isNaN(time.getTime())) return null;
  return new Date(time.getTime() + 8 * 60 * 60 * 1000).toISOString().slice(0, 16) === value
    ? time.toISOString()
    : null;
}

export function formatPhilippineTime(value: string) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "Invalid schedule";
  return new Intl.DateTimeFormat("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Manila",
  }).format(date);
}

export function yearLabel(year: number | null) {
  return year === null ? "All college years" : `${year}${year === 1 ? "st" : year === 2 ? "nd" : year === 3 ? "rd" : "th"} Year`;
}

export async function signedImageUrls(client: SupabaseClient, events: Pick<EventRow, "id" | "image_path">[]) {
  const urls = await Promise.all(events.map(async (event) => {
    const { data } = await client.storage.from(IMAGE_BUCKET).createSignedUrl(event.image_path, 3600);
    return [event.id, data?.signedUrl] as const;
  }));
  return Object.fromEntries(urls.filter((item): item is readonly [string, string] => Boolean(item[1])));
}
