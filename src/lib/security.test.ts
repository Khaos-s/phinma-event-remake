import assert from "node:assert/strict";
import test from "node:test";
import config from "../../next.config.ts";
import { PUBLIC_EVENT_SELECT } from "./events.ts";

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
