import type { PublicEvent } from "./events.ts";

function escapeText(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r\n|\r|\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldLine(value: string) {
  const lines: string[] = [];
  let line = "", bytes = 0;
  for (const char of value) {
    const length = new TextEncoder().encode(char).length;
    if (bytes + length > 75) { lines.push(line); line = " "; bytes = 1; }
    line += char; bytes += length;
  }
  return [...lines, line].join("\r\n");
}

export function eventCalendar(event: Pick<PublicEvent, "id" | "title" | "description" | "starts_at" | "ends_at">, now = new Date()) {
  const stamp = (value: string | Date) => new Date(value).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//PHINMA UI Event//Campus Calendar//EN", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${escapeText(event.id)}@phinma-ui-event.vercel.app`, `DTSTAMP:${stamp(now)}`, `DTSTART:${stamp(event.starts_at)}`, `DTEND:${stamp(event.ends_at)}`,
    `SUMMARY:${escapeText(event.title)}`, `DESCRIPTION:${escapeText(event.description)}`, "END:VEVENT", "END:VCALENDAR", ""].map(foldLine).join("\r\n");
}
