// Public UI fixtures stay in isolated browser contexts. No hosted events or writes are created.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdir, readFile } from "node:fs/promises";
const { chromium } = createRequire(import.meta.url)("playwright");
const base = process.env.TEST_BASE_URL || "http://localhost:3000";
const department = "College of Information Technology";
const organization = { id: "20000000-0000-4000-8000-000000000001", name: "CITE Council", department };
const event = (number, title, starts_at, ends_at) => ({ id: `30000000-0000-4000-8000-${String(number).padStart(12, "0")}`, title, starts_at, ends_at,
  description: "Browser fixture only. A campus workshop for testing public event discovery, sharing, and calendar downloads.",
  department, course: "BSIT", target_year: 2, status: "approved", organization, organization_id: organization.id, image_path: `fixture/${number}.jpg` });
const rows = [
  event(1, "Fixture: Live workshop", "2026-10-26T01:00:00Z", "2026-10-26T02:01:00Z"),
  event(2, "Fixture: Live forum", "2026-10-26T01:30:00Z", "2026-10-26T03:00:00Z"),
  event(3, "Fixture: Upcoming gathering", "2026-10-26T02:02:00Z", "2026-10-26T04:00:00Z"),
  event(4, "Fixture: Past gathering", "2026-10-25T01:00:00Z", "2026-10-25T02:00:00Z"),
];
const photo = await readFile("public/images/phinma-students.jpg");
await mkdir(".taste-skill/public-qa", { recursive: true });
const browser = await chromium.launch({ channel: "msedge", headless: true });

async function fixture({ empty = false, error = false, futureOnly = false, reducedMotion = "reduce", width = 1280, delay = false, appendOnRefresh = false } = {}) {
  const context = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion, acceptDownloads: true });
  await context.addInitScript(() => {
    Object.defineProperty(navigator, "share", { configurable: true, value: undefined });
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async value => { window.copiedEventLink = value; } } });
  });
  let release;
  const gate = new Promise(resolve => { release = resolve; });
  let appendRecord = false;
  await context.route("https://*.supabase.co/**", async route => {
    const request = route.request(), url = new URL(request.url());
    const json = (body, status = 200) => route.fulfill({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (request.method() === "OPTIONS") return route.fulfill({ status: 204 });
    if (url.pathname === "/rest/v1/organizations") return json([organization]);
    if (url.pathname === "/rest/v1/events") {
      assert.equal(url.searchParams.get("status"), "eq.approved");
      for (const privateField of ["created_by", "reviewed_by", "rejection_reason"]) assert.equal(url.searchParams.get("select").includes(privateField), false);
      if (delay) await gate;
      if (error) return json({ message: "Fixture unavailable", code: "XX000" }, 500);
      let data = empty ? [] : futureOnly ? [rows[2]] : rows;
      if (appendOnRefresh && appendRecord) data = [...data, event(5, "Fixture: Newly approved", "2026-10-27T02:00:00Z", "2026-10-27T03:00:00Z")];
      const id = url.searchParams.get("id");
      if (id?.startsWith("eq.")) return json(data.find(item => item.id === id.slice(3)) || null);
      if (id?.startsWith("neq.")) data = data.filter(item => item.id !== id.slice(4));
      return json(data);
    }
    if (url.pathname.startsWith("/storage/v1/object/sign/") && request.method() === "POST") return json({ signedURL: "/object/sign/event-images/fixture.jpg?token=fixture" });
    if (url.pathname.startsWith("/storage/v1/object/sign/")) return route.fulfill({ contentType: "image/jpeg", body: photo });
    throw new Error(`Unexpected public fixture request: ${request.method()} ${url.pathname}`);
  });
  const page = await context.newPage();
  await page.clock.install({ time: new Date("2026-10-26T02:00:00Z") });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(base);
  if (!delay) await page.locator(".event-result-count").filter({ hasNotText: "Loading" }).waitFor();
  return { context, page, errors, release, appendEvent: () => { appendRecord = true; } };
}

try {
  const { context, page, errors, appendEvent } = await fixture({ appendOnRefresh: true });
  assert.equal(await page.locator(".event-card-interactive").count(), 4);
  assert.match(await page.locator(".featured-event h3").innerText(), /Live workshop/);
  assert.equal(await page.locator(".happening-list li").count(), 2);
  assert.equal(await page.locator(".board-filters").count(), 0);
  assert.equal(await page.locator(".event-image > img").first().evaluate(image => getComputedStyle(image).objectFit), "contain");
  assert.equal(await page.locator(".site-header").evaluate(element => getComputedStyle(element).position), "sticky");
  assert.equal(await page.locator(".site-header").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(255, 255, 255)");
  assert.equal(await page.locator(".public-discovery").evaluate(element => getComputedStyle(element).backgroundColor), "rgb(244, 246, 242)");
  assert.equal(await page.locator(".site-footer").evaluate(element => getComputedStyle(element).borderTopColor), "rgb(244, 198, 43)");
  assert.equal(await page.getByRole("group", { name: "Filter events by college" }).getByRole("button").count(), 9);
  await page.getByRole("button", { name: "COM · College of Management", exact: true }).click();
  assert.equal(await page.locator(".event-card-interactive").count(), 0);
  await page.getByRole("button", { name: "CITE · College of Information Technology", exact: true }).click();
  assert.equal(await page.locator(".event-card-interactive").count(), 4);
  assert.equal(await page.locator("#department-filter").inputValue(), department);
  await page.getByRole("button", { name: "All colleges", exact: true }).click();
  await page.getByRole("button", { name: "Show filters", exact: true }).click();
  await page.locator("#event-search").focus();
  for (const selector of ['.discovery-search button[type="submit"]', ".discovery-search .filter-toggle", "#department-filter", "#year-filter", "#course-filter", "#organizer-filter", ".clear-filters"]) {
    await page.keyboard.press("Tab");
    assert.equal(await page.locator(selector).evaluate(element => element === document.activeElement), true, `Keyboard order: ${selector}`);
  }
  await page.getByRole("button", { name: "Hide filters", exact: true }).click();
  for (const width of [1280, 1101, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.locator("#event-search").isVisible(), true, "Search stays visible with filters closed");
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: `.taste-skill/public-qa/home-${width}.png`, fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Home overflow ${width}`);
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByRole("button", { name: "Show filters" }).focus();
  await page.keyboard.press("Space");
  await page.locator("#year-filter").selectOption("2");
  await page.getByRole("button", { name: "Hide filters" }).click();
  await page.getByRole("button", { name: "Show filters" }).click();
  assert.equal(await page.locator("#year-filter").inputValue(), "2");
  await page.locator("#course-filter").selectOption("BSIT");
  await page.locator("#department-filter").selectOption("College of Management");
  assert.equal(await page.locator("#course-filter").inputValue(), "all");
  await page.getByRole("button", { name: "Reset filters" }).click();
  await page.getByRole("button", { name: "Upcoming", exact: true }).click();
  assert.equal(await page.locator(".event-card-interactive").count(), 1);
  await page.getByRole("button", { name: "All", exact: true }).click();
  const trigger = page.getByRole("button", { name: "Preview Fixture: Live workshop", exact: true });
  await trigger.click();
  const originalTrigger = await trigger.elementHandle();
  const preview = page.locator("dialog.event-preview");
  await preview.waitFor({ state: "visible" });
  await preview.getByRole("button", { name: "View full poster for Fixture: Live workshop", exact: true }).click();
  await page.locator("dialog.poster-lightbox[open]").waitFor();
  await page.getByRole("button", { name: "Zoom in", exact: true }).click();
  assert.equal(await page.getByRole("button", { name: "Fit image", exact: true }).getAttribute("aria-pressed"), "true");
  await page.keyboard.press("Escape");
  assert.equal(await preview.evaluate(dialog => dialog.open), true);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "hidden");
  await preview.getByRole("button", { name: "Share", exact: true }).click();
  await preview.getByRole("status").filter({ hasText: "Link copied" }).waitFor();
  assert.equal(await page.evaluate(() => window.copiedEventLink), `${base}/events/${rows[0].id}`);
  const downloading = page.waitForEvent("download");
  await preview.getByRole("button", { name: "Add to calendar" }).click();
  const download = await downloading;
  const calendar = await readFile(await download.path(), "utf8");
  assert.match(calendar, /DTSTART:20261026T010000Z/);
  assert.equal(calendar.includes("\r\nLOCATION:"), false);
  await preview.getByRole("button", { name: "Close event preview" }).focus();
  await page.keyboard.press("Shift+Tab");
  assert.equal(await preview.getByRole("link", { name: "View full details", exact: true }).evaluate(link => link === document.activeElement), true);
  await page.keyboard.press("Tab");
  assert.equal(await preview.getByRole("button", { name: "Close event preview" }).evaluate(button => button === document.activeElement), true);
  appendEvent();
  await page.clock.fastForward(61_000);
  await page.locator(".event-result-count").filter({ hasText: "5 events" }).waitFor();
  assert.equal(await originalTrigger.evaluate(button => button.isConnected), true);
  await page.keyboard.press("Escape");
  assert.equal(await trigger.evaluate(button => button === document.activeElement), true);
  assert.equal(await page.evaluate(() => document.body.style.overflow), "");
  await page.locator(".featured-event h3").filter({ hasText: "Live forum" }).waitFor();
  assert.equal(await page.locator(".happening-list li").count(), 1);

  await page.goto(`${base}/events/${rows[0].id}`);
  await page.getByRole("heading", { name: rows[0].title, exact: true }).waitFor();
  await page.getByRole("heading", { name: "More from this organizer" }).waitFor();
  assert.equal(await page.locator(".related-events .event-card").count(), 3);
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Detail overflow ${width}`);
    await page.screenshot({ path: `.taste-skill/public-qa/detail-${width}.png`, fullPage: true });
  }
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: async data => { window.sharedEvent = data; } }));
  await page.getByRole("button", { name: "Share", exact: true }).click();
  assert.equal(await page.evaluate(() => window.sharedEvent.url), `${base}/events/${rows[0].id}`);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: async () => { throw new DOMException("Canceled", "AbortError"); } }));
  await page.getByRole("button", { name: "Share", exact: true }).click();
  assert.equal(await page.getByLabel("Event link", { exact: true }).count(), 0);
  await page.evaluate(() => Object.defineProperty(navigator, "share", { configurable: true, value: undefined }));
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } }));
  await page.getByRole("button", { name: "Share", exact: true }).click();
  await page.getByLabel("Event link", { exact: true }).waitFor();
  await page.goto(`${base}/contact`);
  await page.getByRole("heading", { name: "Let’s stay connected." }).waitFor();
  assert.equal(await page.locator('main a[href="mailto:info.ui@phinmaed.com"]').count(), 1);
  assert.equal(await page.locator('main a[href="tel:+63333381071;ext=106"]').count(), 1);
  await page.getByRole("button", { name: "Open navigation" }).click();
  await page.getByRole("navigation", { name: "Mobile navigation" }).getByRole("link", { name: "Contact", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.getByRole("button", { name: "Open navigation" }).getAttribute("aria-expanded"), "false");
  for (const width of [1280, 390]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Contact overflow ${width}`);
    await page.screenshot({ path: `.taste-skill/public-qa/contact-${width}.png`, fullPage: true });
  }
  await page.goto(`${base}/showcase`);
  await page.locator(".showcase-filter-row [role=status]").filter({ hasNotText: "Loading" }).waitFor();
  assert.equal(await page.locator(".showcase-screen").count(), 8);
  await page.locator("#showcase-search").fill("no matching fixture");
  await page.getByRole("heading", { name: "No matching campus events" }).waitFor();
  await page.getByRole("button", { name: "Reset filters", exact: true }).click();
  assert.equal(await page.locator(".showcase-event-grid .event-card").count(), 2);
  assert.equal(await page.locator("#showcase-proposal-title").isDisabled(), true);
  const layoutSteps = page.getByRole("group", { name: "Organizer layout preview step" });
  await layoutSteps.getByRole("button", { name: /Review & submit/ }).click();
  await page.locator(".showcase-proposal-full-preview").waitFor();
  assert.equal(await page.locator("#showcase-organizer").getByRole("button", { name: "Submit for review", exact: true }).isDisabled(), true);
  await layoutSteps.getByRole("button", { name: /Event details/ }).click();
  assert.equal(await page.locator("#showcase-proposal-title").isDisabled(), true);
  assert.equal(await page.locator("#showcase-admin .showcase-review-table tbody tr").count(), 1);
  await page.locator(".showcase-event-grid .event-open").first().click();
  assert.equal(await page.locator(".showcase-detail-top h3").evaluate(element => element === document.activeElement), true);
  await page.locator("#showcase-details .poster-open").click();
  await page.locator("dialog.poster-lightbox[open]").waitFor();
  await page.keyboard.press("Escape");
  for (const theme of ["light", "dark"]) {
    await page.evaluate(value => document.documentElement.dataset.theme = value, theme);
    for (const width of [1440, 960, 390, 320]) {
      await page.setViewportSize({ width, height: 900 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Showcase overflow ${theme}/${width}`);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: `.taste-skill/public-qa/showcase-${theme}-${width}.png`, fullPage: true });
    }
  }
  await page.goto(`${base}/email-template`);
  await page.getByRole("heading", { name: "Password reset email.", exact: true }).waitFor();
  const source = await readFile("supabase/templates/recovery.html", "utf8");
  assert.ok(source.includes("{{ .Token }}"));
  assert.equal(source.includes("{{ .ConfirmationURL }}"), false);
  assert.equal(decodeURIComponent((await page.getByRole("link", { name: "Download HTML", exact: true }).getAttribute("href")).split(",").slice(1).join(",")), source);
  await page.getByRole("button", { name: "Copy HTML", exact: true }).click();
  assert.equal(await page.evaluate(() => window.copiedEventLink), source);
  await page.evaluate(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async () => { throw new Error("Denied"); } } }));
  await page.getByRole("button", { name: "Copy HTML", exact: true }).click();
  await page.getByRole("alert").filter({ hasText: "Automatic copy is unavailable" }).waitFor();
  assert.equal(await page.getByRole("textbox", { name: "Reset password email HTML source" }).inputValue(), source);
  for (const width of [1280, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Email template overflow ${width}`);
    await page.screenshot({ path: `.taste-skill/public-qa/email-template-${width}.png`, fullPage: true });
  }
  assert.deepEqual(errors, []);
  await context.close();
  console.log("PASS populated discovery, filters, minute refresh, nested poster/quick-view focus, ICS download, share/fallback, related events, contact, eight-screen showcase and email template copy/download/fallback");

  const future = await fixture({ futureOnly: true });
  assert.equal(await future.page.locator(".event-countdown").count(), 1);
  await future.page.clock.fastForward(120_000);
  await future.page.locator(".live-label").waitFor();
  assert.equal(await future.page.locator(".event-countdown").count(), 0);
  assert.equal(await future.page.locator(".campus-hero h1").evaluate(element => getComputedStyle(element).animationName), "none");
  await future.context.close();
  for (const options of [{ empty: true }, { error: true }, { delay: true }]) {
    const state = await fixture(options);
    assert.equal(await state.page.locator(".featured-event").count(), 0);
    if (options.empty) {
      await state.page.getByText("Nothing is happening right now.", { exact: false }).waitFor();
      await state.page.getByRole("link", { name: "See what’s coming up." }).click();
      assert.equal(await state.page.getByRole("button", { name: "Upcoming", exact: true }).getAttribute("aria-pressed"), "true");
    } else if (options.error) {
      await state.page.getByRole("alert").filter({ hasText: "Events could not be loaded" }).waitFor();
      assert.equal(await state.page.locator(".event-result-count").innerText(), "Unavailable");
    } else {
      assert.equal(await state.page.locator(".event-skeleton").count(), 3);
      state.release();
      await state.page.locator(".featured-event").waitFor();
    }
    await state.context.close();
  }
  const motion = await fixture({ reducedMotion: "no-preference" });
  await motion.page.screenshot({ path: ".taste-skill/public-qa/motion-1280.png", fullPage: true });
  assert.notEqual(await motion.page.locator(".campus-hero h1").evaluate(element => getComputedStyle(element).animationName), "none");
  await motion.page.emulateMedia({ reducedMotion: "reduce" });
  assert.equal(await motion.page.locator(".campus-hero h1").evaluate(element => getComputedStyle(element).animationName), "none");
  assert.equal(await motion.page.locator(".reveal-pending").count(), 0);
  await motion.context.close();
  const noScript = await browser.newContext({ javaScriptEnabled: false, reducedMotion: "reduce" });
  const staticPage = await noScript.newPage();
  await staticPage.goto(base);
  assert.equal(await staticPage.locator(".campus-hero h1").isVisible(), true);
  assert.equal(await staticPage.locator(".reveal-pending").count(), 0);
  await noScript.close();
  console.log("PASS countdown/start boundary, honest empty/error/skeleton states, reduced motion and preference changes");
} catch (error) {
  for (const context of browser.contexts()) for (const page of context.pages()) {
    if (!page.url().startsWith(base)) continue;
    console.error("Browser failure at", page.url(), (await page.locator("body").innerText()).slice(0, 1300));
    await page.screenshot({ path: ".taste-skill/public-qa/failure.png", fullPage: true });
  }
  throw error;
} finally { await browser.close(); }
