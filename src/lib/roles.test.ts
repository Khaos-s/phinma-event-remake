import assert from "node:assert/strict";
import test from "node:test";
import { resolveRole, roleHome } from "./roles.ts";

test("only stored organizer and administrator grants open their workspaces", () => {
  assert.equal(roleHome(resolveRole("cite_organizer")), "/organizer");
  assert.equal(roleHome(resolveRole("event_admin")), "/admin");
});

test("missing or unrecognized roles receive member access", () => {
  for (const value of [null, undefined, "admin", "student", { role: "event_admin" }]) {
    assert.equal(resolveRole(value), "member");
    assert.equal(roleHome(resolveRole(value)), "/account");
  }
});
