// Browser-only fixtures: no real email, password change, or review is sent to Supabase.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const owner = "10000000-0000-4000-8000-000000000001";
const user = { id: owner, aud: "authenticated", role: "authenticated", email: "browser-fixture@example.invalid" };
const payload = Buffer.from(JSON.stringify({ sub: owner, exp: Math.floor(Date.now() / 1000) + 3600 })).toString("base64url");
const session = { access_token: `e30.${payload}.fixture`, refresh_token: "fixture", expires_at: Math.floor(Date.now() / 1000) + 3600, expires_in: 3600, token_type: "bearer", user };
const photo = await readFile("public/images/phinma-students.jpg");
const browser = await chromium.launch({ channel: "msedge", headless: true });
await mkdir(".taste-skill/account-qa", { recursive: true });

async function fixture({ admin = false, dark = true, reduced = true, extension = false, delay = false, failRecover = false, failUpdate = false } = {}) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, colorScheme: dark ? "dark" : "light", reducedMotion: reduced ? "reduce" : "no-preference" });
  if (admin) await context.addCookies([{ name: "sb-ulymtioaxraqvoqongrj-auth-token", value: `base64-${Buffer.from(JSON.stringify(session)).toString("base64url")}`, url: base }]);
  if (extension) await context.addInitScript(() => {
    const observer = new MutationObserver(() => {
      if (!document.body) return;
      document.body.setAttribute("data-new-gr-c-s-check-loaded", "14.1339.0");
      document.body.setAttribute("data-gr-ext-installed", "");
      observer.disconnect();
    });
    observer.observe(document, { subtree: true, childList: true });
  });
  const calls = [];
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  const organization = { id: "20000000-0000-4000-8000-000000000001", name: "CITE Council", department: "College of Information Technology" };
  const rows = ["pending", "approved", "rejected"].map((status, index) => ({ id: `30000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, created_by: owner, organization_id: organization.id, organization, status,
    title: `Fixture: ${status} submission`, description: "An isolated browser fixture.", image_path: `${owner}/fixture.png`, course: "BSIT", department: organization.department, target_year: 2,
    starts_at: "2027-01-01T01:00:00Z", ends_at: "2027-01-01T02:00:00Z", rejection_reason: status === "rejected" ? "Clarify the schedule." : null, created_at: "2026-10-26T00:00:00Z" }));
  await context.route("https://*.supabase.co/**", async route => {
    const request = route.request(), url = new URL(request.url()), path = url.pathname;
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", headers: { "x-supabase-api-version": "2024-01-01", "access-control-expose-headers": "x-supabase-api-version" }, body: JSON.stringify(body) });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 });
    if (path === "/auth/v1/recover") {
      calls.push({ action: "recover", body: request.postDataJSON(), redirect: url.searchParams.get("redirect_to") });
      if (delay) await gate;
      if (failRecover) return json({ msg: "Fixture recovery error", code: failRecover.code || "over_email_send_rate_limit" }, failRecover.status || 429);
      return json({});
    }
    if (path === "/auth/v1/token") {
      if (url.searchParams.get("grant_type") === "password") { calls.push({ action: "sign-in" }); return json(session); }
      assert.equal(url.searchParams.get("grant_type"), "pkce");
      assert.ok(request.postDataJSON().code_verifier);
      calls.push({ action: "exchange" });
      return json(session);
    }
    if (path === "/auth/v1/verify") {
      const body = request.postDataJSON();
      calls.push({ action: "verify", body });
      assert.equal(body.type, "recovery");
      assert.equal(body.email, user.email);
      if (body.token !== "006123") return json({ msg: "Token has expired or is invalid", code: "otp_expired" }, 403);
      return json(session);
    }
    if (path === "/auth/v1/user") {
      if (request.method() === "PUT") {
        calls.push({ action: "password", body: request.postDataJSON() });
        if (failUpdate) { failUpdate = false; return json({ msg: "Use a stronger password.", code: "weak_password" }, 422); }
      }
      return json(user);
    }
    if (path === "/rest/v1/role_assignments") return json(admin ? { role: "event_admin", organization_id: null } : null);
    if (path === "/rest/v1/organizations" || path === "/rest/v1/events") return json([]);
    if (path === "/rest/v1/rpc/workspace_events") return json(rows);
    if (path.startsWith("/storage/v1/object/sign/") && request.method() === "POST") return json({ signedURL: "/object/sign/event-images/fixture.jpg?token=fixture" });
    if (path.startsWith("/storage/v1/object/sign/")) return route.fulfill({ contentType: "image/jpeg", body: photo });
    if (path === "/rest/v1/rpc/approve_event" || path === "/rest/v1/rpc/reject_event") {
      const data = request.postDataJSON();
      calls.push({ action: "review", path, body: data });
      const row = rows.find(row => row.id === data.event_id);
      assert.equal(row.status, "pending");
      row.status = path.endsWith("approve_event") ? "approved" : "rejected";
      row.rejection_reason = data.reason || null;
      return route.fulfill({ status: 204 });
    }
    throw new Error(`Unexpected fixture request: ${request.method()} ${path}`);
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (/hydrated|hydration|didn't match/i.test(message.text())) errors.push(message.text()); });
  return { context, page, calls, errors, release };
}

async function noOverflow(page, label) { assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, label); }

try {
  const theme = await fixture({ extension: true });
  await theme.page.goto(base);
  await theme.page.getByRole("button", { name: "Switch to light theme" }).waitFor();
  assert.equal(await theme.page.locator("html").getAttribute("data-theme"), "dark");
  assert.equal(await theme.page.locator("body").getAttribute("data-gr-ext-installed"), "");
  for (const path of ["/", "/events", "/login", "/contact", "/forgot-password", "/reset-password", "/showcase", "/email-template"]) {
    await theme.page.goto(`${base}${path}`);
    await theme.page.getByRole("button", { name: "Switch to light theme" }).waitFor();
    const animatedContent = theme.page.locator(path === "/" ? ".campus-hero-content" : "main#main-content");
    assert.equal(await animatedContent.evaluate(element => getComputedStyle(element).animationName), "none");
    if (path === "/login") {
      assert.equal(await theme.page.locator("main img, .login-story").count(), 0);
      assert.equal(await theme.page.locator(".login-layout").evaluate(element => getComputedStyle(element).gridTemplateColumns.split(" ").length), 1);
    }
    await theme.page.emulateMedia({ reducedMotion: "no-preference" });
    assert.equal(await animatedContent.evaluate(element => getComputedStyle(element).animationName), "page-enter");
    await theme.page.emulateMedia({ reducedMotion: "reduce" });
    for (const width of [1280, 390, 320]) {
      await theme.page.setViewportSize({ width, height: 900 });
      await noOverflow(theme.page, `${path} dark overflow ${width}`);
      if (width !== 320) await theme.page.screenshot({ path: `.taste-skill/account-qa/dark-${path.replaceAll("/", "") || "home"}-${width}.png`, fullPage: true });
    }
  }
  await theme.page.getByRole("button", { name: "Switch to light theme" }).click();
  await theme.page.reload();
  await theme.page.getByRole("button", { name: "Switch to dark theme" }).waitFor();
  await theme.page.emulateMedia({ colorScheme: "light" });
  assert.equal(await theme.page.locator("html").getAttribute("data-theme"), "light");
  assert.deepEqual(theme.errors, []);
  await theme.context.close();
  console.log("PASS extension attributes, hydration, dark preference, persisted toggle and responsive public/auth pages");

  const recovery = await fixture({ delay: true, reduced: false, failUpdate: true });
  await recovery.page.goto(`${base}/login`);
  assert.equal(await recovery.page.locator("main#main-content").evaluate(element => getComputedStyle(element).animationName), "page-enter");
  await recovery.page.getByRole("link", { name: "Forgot password?" }).click();
  await recovery.page.getByRole("heading", { name: "Forgot your password?" }).waitFor();
  await recovery.page.getByLabel("Email address").fill(user.email);
  await recovery.page.getByRole("button", { name: "Send reset code" }).click();
  await recovery.page.locator('button[aria-busy="true"]').waitFor();
  assert.equal(await recovery.page.locator(".loading-spinner").evaluate(element => getComputedStyle(element).animationName), "loading-spin");
  recovery.release();
  await recovery.page.getByLabel("6-digit code", { exact: true }).waitFor();
  assert.equal(await recovery.page.getByRole("button", { name: "Resend code in", exact: false }).isDisabled(), true);
  await recovery.page.locator(".toast-success").waitFor();
  await recovery.page.getByRole("button", { name: "Dismiss notification" }).click();
  assert.equal(await recovery.page.locator(".toast").count(), 0);
  const request = recovery.calls.find(call => call.action === "recover");
  assert.equal(request.body.email, user.email);
  assert.equal(request.body.code_challenge_method, "s256");
  await recovery.page.getByLabel("6-digit code", { exact: true }).fill("111111");
  await recovery.page.getByRole("button", { name: "Verify code", exact: true }).click();
  await recovery.page.getByRole("alert").filter({ hasText: "invalid or has expired" }).waitFor();
  assert.equal(await recovery.page.locator("#new-password").count(), 0);
  await recovery.page.getByLabel("6-digit code", { exact: true }).fill("006123");
  await recovery.page.getByRole("button", { name: "Verify code", exact: true }).click();
  await recovery.page.getByLabel("New password", { exact: true }).waitFor();
  assert.equal(recovery.calls.filter(call => call.action === "verify").length, 2);
  assert.equal(recovery.calls.filter(call => call.action === "verify")[1].body.token, "006123");
  await recovery.page.getByLabel("New password", { exact: true }).fill("Fixture-password-1!");
  await recovery.page.getByLabel("Confirm new password").fill("Fixture-password-2!");
  await recovery.page.getByRole("button", { name: "Update password", exact: true }).click();
  await recovery.page.getByRole("alert").filter({ hasText: "do not match" }).waitFor();
  assert.equal(recovery.calls.filter(call => call.action === "password").length, 0);
  await recovery.page.getByLabel("Confirm new password").fill("Fixture-password-1!");
  await recovery.page.getByRole("button", { name: "Update password", exact: true }).click();
  await recovery.page.getByRole("alert").filter({ hasText: "stronger password" }).waitFor();
  await recovery.page.getByRole("button", { name: "Update password", exact: true }).click();
  await recovery.page.locator(".success-notice").filter({ hasText: "password has been updated" }).waitFor();
  assert.equal(recovery.calls.filter(call => call.action === "password").length, 2);
  assert.deepEqual(recovery.calls.find(call => call.action === "password").body, { password: "Fixture-password-1!", code_challenge: null, code_challenge_method: null });
  await recovery.page.getByRole("link", { name: "Continue to your account" }).click();
  await recovery.page.getByRole("heading", { name: "University profile" }).waitFor();
  assert.equal(await recovery.page.locator("main#main-content").evaluate(element => getComputedStyle(element).animationName), "page-enter");
  assert.deepEqual(recovery.errors, []);
  await recovery.context.close();
  console.log("PASS Supabase recovery request, six-digit OTP verification, leading zeroes, resend cooldown, password validation/update, toast and spinner");

  const fallback = await fixture();
  await fallback.page.goto(`${base}/forgot-password`);
  await fallback.page.getByLabel("Email address").fill(user.email);
  await fallback.page.getByRole("button", { name: "Send reset code" }).click();
  await fallback.page.getByLabel("6-digit code", { exact: true }).waitFor();
  const rootCallback = new URL(fallback.calls[0].redirect);
  rootCallback.pathname = "/"; rootCallback.searchParams.set("code", "fixture-root-code");
  await fallback.page.goto(rootCallback.href);
  await fallback.page.waitForURL(`${base}/reset-password`);
  await fallback.page.getByLabel("New password", { exact: true }).waitFor();
  await fallback.page.getByRole("link", { name: "Back to sign in", exact: true }).click();
  await fallback.page.getByRole("heading", { name: "Welcome back." }).waitFor();
  await fallback.page.getByLabel("Email address").fill(user.email);
  await fallback.page.getByLabel("Password", { exact: true }).fill("Fixture-password-1!");
  await fallback.page.getByRole("button", { name: "Sign in", exact: true }).click();
  await fallback.page.getByRole("heading", { name: "University profile" }).waitFor();
  assert.equal(fallback.calls.filter(call => call.action === "sign-in").length, 1);
  assert.deepEqual(fallback.errors, []);
  await fallback.context.close();
  const expired = await fixture({ failRecover: true });
  await expired.page.goto(`${base}/reset-password?code=expired-fixture-code`);
  await expired.page.getByRole("alert").filter({ hasText: "invalid or has expired" }).waitFor();
  assert.equal(await expired.page.locator("#new-password").count(), 0);
  await expired.page.getByRole("link", { name: "Request a reset code" }).click();
  await expired.page.getByLabel("Email address").fill(user.email);
  await expired.page.getByRole("button", { name: "Send reset code" }).click();
  await expired.page.getByRole("alert").filter({ hasText: "Email sending limit reached" }).waitFor();
  await expired.page.locator(".toast-error").waitFor();
  const retry = expired.page.getByRole("button", { name: /Try again in/ });
  assert.equal(await retry.isDisabled(), true);
  assert.equal(expired.calls.filter(call => call.action === "recover").length, 1);
  for (const width of [1280, 390]) {
    await expired.page.setViewportSize({ width, height: 900 });
    await noOverflow(expired.page, `Recovery error overflow ${width}`);
    await expired.page.screenshot({ path: `.taste-skill/account-qa/rate-limited-${width}.png`, fullPage: true });
  }
  assert.equal(await expired.page.locator(".success-notice").count(), 0);
  await expired.context.close();
  for (const failure of [
    { code: "over_request_rate_limit", status: 429, message: "Too many reset requests", disabled: true },
    { code: "email_address_not_authorized", status: 403, message: "Email delivery is restricted", disabled: false },
    { code: "unexpected_failure", status: 500, message: "could not be requested", disabled: false },
  ]) {
    const failed = await fixture({ failRecover: failure });
    await failed.page.goto(`${base}/forgot-password`);
    await failed.page.getByLabel("Email address").fill(user.email);
    await failed.page.getByRole("button", { name: "Send reset code" }).click();
    await failed.page.getByRole("alert").filter({ hasText: failure.message }).waitFor();
    assert.equal(await failed.page.locator('button[type="submit"]').isDisabled(), failure.disabled);
    assert.equal(await failed.page.locator("#recovery-code").count(), 0);
    assert.equal(failed.calls.filter(call => call.action === "recover").length, 1);
    assert.deepEqual(failed.errors, []);
    await failed.context.close();
  }
  console.log("PASS root recovery redirect, expired session, email/request rate limits, restricted delivery and server failure");

  const admin = await fixture({ admin: true });
  await admin.page.goto(`${base}/admin`);
  await admin.page.getByRole("heading", { name: "Manage events", exact: true }).waitFor();
  await admin.page.emulateMedia({ reducedMotion: "no-preference" });
  assert.equal(await admin.page.locator("main#main-content").evaluate(element => getComputedStyle(element).animationName), "page-enter");
  await admin.page.emulateMedia({ reducedMotion: "reduce" });
  await admin.page.getByRole("button", { name: "Inspect submission", exact: true }).click();
  const inspection = admin.page.getByRole("region", { name: "Full submission: Fixture: pending submission", exact: true });
  await inspection.waitFor();
  assert.equal(await inspection.getByRole("button", { name: "Share", exact: true }).count(), 0);
  assert.equal(await inspection.getByRole("button", { name: "Add to calendar", exact: true }).count(), 0);
  await inspection.locator(".poster-open").click();
  await admin.page.locator("dialog.poster-lightbox[open]").waitFor();
  await admin.page.keyboard.press("Escape");
  assert.equal(await inspection.isVisible(), true);
  await admin.page.getByRole("button", { name: "Close inspection", exact: true }).click();
  const filters = admin.page.getByRole("group", { name: "Submission status" });
  assert.equal(await admin.page.locator(".admin-review-row").count(), 1);
  for (const label of ["Published", "Rejected", "All"]) {
    await filters.getByRole("button", { name: label, exact: true }).click();
    assert.equal(await admin.page.locator(".admin-review-row").count(), label === "All" ? 3 : 1);
    assert.equal(await admin.page.getByRole("button", { name: "Approve and publish" }).count(), label === "All" ? 1 : 0);
  }
  assert.equal(await admin.page.getByRole("link", { name: "Reviewed events", exact: true }).count(), 0);
  assert.equal(await admin.page.getByRole("link", { name: "Browse events", exact: true }).getAttribute("href"), "/events");
  for (const width of [1280, 390, 320]) {
    await admin.page.setViewportSize({ width, height: 900 });
    await noOverflow(admin.page, `Admin overflow ${width}`);
    await admin.page.screenshot({ path: `.taste-skill/account-qa/admin-dark-${width}.png`, fullPage: true });
  }
  await admin.page.evaluate(() => document.documentElement.dataset.theme = "light");
  for (const width of [1440, 390]) {
    await admin.page.setViewportSize({ width, height: 900 });
    await noOverflow(admin.page, `Admin light overflow ${width}`);
    await admin.page.screenshot({ path: `.taste-skill/account-qa/admin-light-${width}.png`, fullPage: true });
  }
  await filters.getByRole("button", { name: "Pending", exact: true }).click();
  await admin.page.getByRole("button", { name: "Reject", exact: true }).click();
  await admin.page.getByRole("alert").filter({ hasText: "rejection reason" }).waitFor();
  assert.equal(admin.calls.filter(call => call.action === "review").length, 0);
  await admin.page.getByRole("button", { name: "Approve and publish" }).click();
  await admin.page.locator(".success-notice").filter({ hasText: "approved and published" }).waitFor();
  await admin.page.getByRole("heading", { name: "You’re all caught up" }).waitFor();
  assert.equal(await admin.page.locator("#submissions-title").evaluate(element => element === document.activeElement), true);
  await filters.getByRole("button", { name: "Published", exact: true }).click();
  assert.equal(await admin.page.locator(".admin-review-row").count(), 2);
  assert.equal(await admin.page.getByRole("button", { name: "Approve and publish" }).count(), 0);
  await admin.page.goto(base);
  await admin.page.setViewportSize({ width: 667, height: 320 });
  await admin.page.getByRole("button", { name: "Open navigation" }).click();
  const mobileSignOut = admin.page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("button", { name: "Sign out", exact: true });
  await mobileSignOut.scrollIntoViewIfNeeded();
  const signOutBounds = await mobileSignOut.boundingBox();
  assert.ok(signOutBounds.y >= 0 && signOutBounds.y + signOutBounds.height <= 320, "Landscape navigation must reach Sign out");
  await admin.page.screenshot({ path: ".taste-skill/account-qa/navigation-landscape.png" });
  assert.deepEqual(admin.errors, []);
  await admin.context.close();
  console.log("PASS unified admin filters, locked decisions, approval, rejection validation, toasts and mobile layouts");
} finally { await browser.close(); }
