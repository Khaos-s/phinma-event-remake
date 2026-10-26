import assert from "node:assert/strict";
import test from "node:test";
import { eventStage, formatPhilippineTime, matchesEventFilters, philippineTimeInput, philippineTimeToIso } from "./events.ts";
import { chooseFeatured, eventCountdown, eventDateTile, ongoingApproved, relatedEvents } from "./public-events.ts";
import { eventCalendar } from "./calendar.ts";
import type { PublicEvent } from "./events.ts";

test("date tiles use the Philippine calendar day and handle unavailable dates", () => {
  assert.deepEqual(eventDateTile("2026-12-31T18:30:00Z"), { day: "01", month: "Jan" });
  assert.equal(eventDateTile("infinity"), null);
});

const publicFixture = (id: string, starts_at: string, ends_at: string, status: PublicEvent["status"] = "approved"): PublicEvent => ({
  id, title: id, description: "Test fixture", organization_id: "council", organization: { id: "council", name: "CITE Council", department: "College of Information Technology" },
  department: "College of Information Technology", course: "BSIT", target_year: null, image_path: "fixture.png", starts_at, ends_at, status,
});

test("featured event prefers ongoing earliest end, then nearest approved start", () => {
  const now = Date.parse("2026-10-26T02:00:00Z");
  const later = publicFixture("later", "2026-10-27T00:00:00Z", "2026-10-27T03:00:00Z");
  const live = publicFixture("live", "2026-10-26T01:00:00Z", "2026-10-26T03:00:00Z");
  const soonEnding = publicFixture("soon-ending", "2026-10-26T01:00:00Z", "2026-10-26T02:30:00Z");
  const pending = { ...soonEnding, id: "private", status: "pending" as const };
  assert.equal(chooseFeatured([later, live, pending, soonEnding], now)?.id, "soon-ending");
  assert.equal(chooseFeatured([later, pending], now)?.id, "later");
  assert.equal(chooseFeatured([soonEnding], Date.parse(soonEnding.ends_at)), undefined);
  assert.equal(chooseFeatured([], now), undefined);
  assert.equal(chooseFeatured([publicFixture("invalid", "invalid", "invalid")], now), undefined);
});

test("countdown rounds up the last minute and stops at the start boundary", () => {
  const start = "2026-10-27T03:01:00Z";
  assert.deepEqual(eventCountdown(start, Date.parse("2026-10-26T01:00:00Z")), { days: 1, hours: 2, minutes: 1 });
  assert.deepEqual(eventCountdown(start, Date.parse(start) - 1000), { days: 0, hours: 0, minutes: 1 });
  assert.equal(eventCountdown(start, Date.parse(start)), null);
  assert.equal(eventCountdown("invalid", Date.now()), null);
});

test("happening now includes exact start, excludes exact end and unpublished events", () => {
  const item = publicFixture("live", "2026-10-26T01:00:00Z", "2026-10-26T03:00:00Z");
  assert.equal(ongoingApproved([item], Date.parse(item.starts_at)).length, 1);
  assert.equal(ongoingApproved([item], Date.parse(item.ends_at)).length, 0);
  assert.equal(ongoingApproved([{ ...item, status: "rejected" }], Date.parse(item.starts_at)).length, 0);
});

test("related events exclude the current/private rows, prefer organizer and cap at three", () => {
  const item = publicFixture("current", "2026-10-26T01:00:00Z", "2026-10-26T03:00:00Z");
  const peers = [1, 2, 3, 4].map(id => ({ ...item, id: String(id) }));
  assert.deepEqual(relatedEvents([item, ...peers, { ...item, id: "private", status: "pending" }], item).events.map(event => event.id), ["1", "2", "3"]);
  const department = { ...item, id: "staff", organization_id: "other" };
  assert.equal(relatedEvents([department], item).heading, "More in this department");
  assert.equal(relatedEvents([item], item).events.length, 0);
});

test("calendar exports preserve UTC time, escape injection and fold UTF-8 lines", () => {
  const item = publicFixture("calendar", "2026-12-31T18:30:00Z", "2026-12-31T19:30:00Z");
  const output = eventCalendar({ ...item, title: "CITE, workshop; A\\B", description: "Hello\r\nLOCATION:Injected\n" + "🎓".repeat(80) }, new Date("2026-10-26T00:00:00Z"));
  assert.match(output, /DTSTART:20261231T183000Z\r\nDTEND:20261231T193000Z/);
  assert.ok(output.includes("SUMMARY:CITE\\, workshop\\; A\\\\B"));
  assert.equal(output.includes("\r\nLOCATION:"), false);
  assert.ok(output.includes("Hello\\nLOCATION:Injected\\n"));
  for (const line of output.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.ok(output.endsWith("END:VCALENDAR\r\n"));
  assert.throws(() => eventCalendar({ ...item, starts_at: "invalid" }));
});

const schedule = {
  starts_at: "2026-10-22T01:00:00.000Z",
  ends_at: "2026-10-22T03:00:00.000Z",
};

test("invalid database schedules cannot crash event rendering", () => {
  for (const value of ["infinity", "-infinity", "294276-01-01T00:00:00Z", "invalid"]) {
    assert.equal(formatPhilippineTime(value), "Invalid schedule");
  }
  assert.match(formatPhilippineTime(schedule.starts_at), /2026/);
});

test("event stages include exact start and exclude exact end", () => {
  assert.equal(eventStage(schedule, Date.parse("2026-10-22T00:59:59Z")), "upcoming");
  assert.equal(eventStage(schedule, Date.parse(schedule.starts_at)), "ongoing");
  assert.equal(eventStage(schedule, Date.parse(schedule.ends_at)), "past");
});

test("form times are interpreted in Philippine time", () => {
  assert.equal(philippineTimeToIso("2026-10-22T09:00"), schedule.starts_at);
  assert.equal(philippineTimeToIso("not a date"), null);
  assert.equal(philippineTimeToIso("2026-02-30T09:00"), null);
});

test("revision inputs show Philippine time across UTC date and year boundaries", () => {
  assert.equal(philippineTimeInput(schedule.starts_at), "2026-10-22T09:00");
  assert.equal(philippineTimeInput("2026-12-31T18:30:00Z"), "2027-01-01T02:30");
  assert.equal(philippineTimeInput("invalid"), "");
});

test("calendar filters combine time, audience, and search without hiding all-year events", () => {
  const event = { ...schedule, title: "CITE Tech Week", description: "Campus workshop", department: "College of Information Technology", course: "BSIT", target_year: null, organization_id: "council" };
  const filters = { stage: "ongoing" as const, year: "2", query: "  TECH  " };
  const now = Date.parse(schedule.starts_at);
  assert.equal(matchesEventFilters(event, filters, now), true);
  assert.equal(matchesEventFilters({ ...event, target_year: 1 }, filters, now), false);
  assert.equal(matchesEventFilters(event, { ...filters, query: "sports" }, now), false);
  assert.equal(matchesEventFilters(event, filters, Date.parse(schedule.ends_at)), false);
});

test("department, course, and organizer filters narrow results independently", () => {
  const event = { ...schedule, title: "Technology forum", description: "Workshop", department: "College of Information Technology", course: "BSIT", target_year: null, organization_id: "council" };
  const filters = { stage: "all" as const, year: "all", query: "", department: "all", course: "all", organizer: "all" };
  const now = Date.parse(schedule.starts_at);
  assert.equal(matchesEventFilters(event, { ...filters, department: event.department, course: "BSIT", organizer: "council" }, now), true);
  assert.equal(matchesEventFilters(event, { ...filters, department: "College of Management" }, now), false);
  assert.equal(matchesEventFilters(event, { ...filters, course: "BSHM" }, now), false);
  const management = { ...event, department: "College of Management", course: "BSHM", organization_id: "staff" };
  assert.equal(matchesEventFilters(management, filters, now), true);
  assert.equal(matchesEventFilters(management, { ...filters, organizer: "council" }, now), false);
  assert.equal(matchesEventFilters({ ...event, organization_id: "faculty" }, { ...filters, organizer: "council" }, now), false);
});
