import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const source = readFileSync(new URL("./site-showcase.tsx", import.meta.url), "utf8");

test("the public showcase reads approved announcements and never workspace records", () => {
  assert.match(source, /\.from\("events"\)\.select\(PUBLIC_EVENT_SELECT\)\.eq\("status", "approved"\)/);
  assert.doesNotMatch(source, /\.rpc\(|role_assignments|created_by|reviewed_by|rejection_reason/);
  assert.match(source, /fieldset disabled/);
  assert.match(source, /no private submissions are loaded/);
});

test("all eight showcase panels have distinct accessible headings", () => {
  const ids = [...source.matchAll(/<Screen id="([^"]+)" number="(\d+)"/g)];
  assert.equal(ids.length, 8);
  assert.equal(new Set(ids.map(match => match[1])).size, 8);
  assert.deepEqual(ids.map(match => match[2]), ["01", "02", "03", "04", "05", "06", "07", "08"]);
  assert.match(source, /aria-labelledby=\{`\$\{id\}-title`\}/);
});
