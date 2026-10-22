import assert from "node:assert/strict";
import test from "node:test";
import { eventStage, philippineTimeToIso } from "./events.ts";

const schedule = {
  starts_at: "2026-10-22T01:00:00.000Z",
  ends_at: "2026-10-22T03:00:00.000Z",
};

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
