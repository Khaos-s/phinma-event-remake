import assert from "node:assert/strict";
import test from "node:test";
import config from "../../next.config.ts";
import { PUBLIC_EVENT_SELECT } from "./events.ts";
import { publicEventMetadata } from "./public-event-metadata.ts";

test("event metadata reads approved announcement text anonymously and handles missing events", async () => {
  const originalFetch = globalThis.fetch;
  const previous = { NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY };
  Object.assign(process.env, { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-fixture" });
  let requests = 0;
  try {
    globalThis.fetch = async (input, init) => {
      requests++;
      const url = new URL(String(input));
      assert.equal(url.searchParams.get("select"), "title,description");
      assert.equal(url.searchParams.get("status"), "eq.approved");
      assert.equal(new Headers(init?.headers).has("cookie"), false);
      return Response.json([{ title: "Approved workshop", description: "Public announcement", reviewed_by: "private-secret" }]);
    };
    await publicEventMetadata("invalid");
    assert.equal(requests, 0);
    const metadata = await publicEventMetadata("30000000-0000-4000-8000-000000000001");
    assert.equal(metadata.title, "Approved workshop | PHINMA UI Event");
    assert.equal(JSON.stringify(metadata).includes("private-secret"), false);
    globalThis.fetch = async () => Response.json([]);
    assert.deepEqual((await publicEventMetadata("30000000-0000-4000-8000-000000000001")).robots, { index: false });
    globalThis.fetch = async () => { throw new Error("offline"); };
    assert.equal((await publicEventMetadata("30000000-0000-4000-8000-000000000001")).title, "Event details | PHINMA UI Event");
  } finally {
    globalThis.fetch = originalFetch;
    for (const [key, value] of Object.entries(previous)) { if (value === undefined) delete process.env[key]; else process.env[key] = value; }
  }
});

test("production headers block framing and restrict external connections", async () => {
  const previous = { NODE_ENV: process.env.NODE_ENV, NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL };
  Object.assign(process.env, { NODE_ENV: "production", NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co" });
  try {
    assert.ok(config.headers);
    const rules = await config.headers();
    const headers = Object.fromEntries(rules.find(rule => rule.source === "/:path*")!.headers.map(header => [header.key, header.value]));
    const csp = headers["Content-Security-Policy"];
    assert.match(csp, /frame-ancestors 'none'/);
    assert.match(csp, /object-src 'none'/);
    assert.match(csp, /connect-src 'self' https:\/\/example\.supabase\.co;/);
    assert.equal(csp.includes("unsafe-eval"), false);
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.equal(headers["X-Frame-Options"], "DENY");
    assert.equal(headers["Referrer-Policy"], "no-referrer");
    assert.equal(config.poweredByHeader, false);
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
  }
});

test("public event requests omit account and review metadata", () => {
  assert.equal(PUBLIC_EVENT_SELECT.includes("*"), false);
  for (const field of ["created_by", "reviewed_by", "reviewed_at", "rejection_reason", "created_at"]) {
    assert.equal(PUBLIC_EVENT_SELECT.includes(field), false);
  }
});
