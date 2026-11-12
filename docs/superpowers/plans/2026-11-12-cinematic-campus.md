# Cinematic Campus Implementation Plan

> Execute inline with superpowers:executing-plans; preserve the existing data and authorization flows.

**Goal:** Deliver the owner's approved cinematic campus direction with full-screen composition and accessible motion.
**Architecture:** Existing React components, CSS graphics, native animations and the existing reveal hook. No dependencies or backend changes.
**Tech Stack:** Next.js 16.4.2, React, TypeScript, Tailwind/CSS.
**Design:** Owner approved cinematic campus on 12 November 2026: immersive campus photography, oversized headings, graphic rings/gold accents, section reveals, full-width workspaces, responsive and reduced-motion variants.

## Scope

EventBrowser hero markup; shared cinematic stylesheet imported after globals; login photo composition; shared public/workspace presentation; design/context documentation. Preserve callers, event queries, forms, preview lifecycle and test fixtures. Existing account-management defects are outside this visual change.

## Constraints and review focus

- Use real campus assets and real Supabase data; no fake events, counts or identities.
- Keep CSS animation to transforms/opacity; support reduced motion and pausing decorative loops.
- Full screen means viewport-filling, scrollable content, not browser fullscreen or scroll hijacking.
- Check 320/390/768/1440px, expanded filters, long content and keyboard focus.
- Retain light/dark support, auth boundaries and form state.

## Tasks

- [x] Update hero composition with photo, rings, typographic hierarchy and pause control; restyle shared surfaces and login using existing components.
- [x] Run Node tests, lint and build. Inspect desktop/mobile, pause, filters and real public reads. Reduced motion reviewed in CSS; OS emulation not run. Protected workspace layouts use isolated fixtures, not real accounts.
- [ ] Review diff; document checks, commit/push only intended files, verify matching production deployment and live layout.

Ruling: Use CSS rather than introducing an animation package; the requested graphics need no additional runtime. Use a visual browser self-check for this reversible presentation work instead of new tests that mirror CSS.

Verification ledger: 26 Node tests passed; lint/build passed. Checked 1440px desktop, 320/390px phones and 768px tablet; public reads and image loading work. Fixture-backed workspace checks make no hosted writes. Fixed pause affecting entrances on resize and dark-mode placeholder contrast. Independent static review found the placeholder issue; it is corrected. Existing browser suites remain unavailable without Playwright; no real sign-in/upload or full workflow check was performed.
