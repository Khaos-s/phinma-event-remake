## 2026-10-26: campus showcase, catalog labels, recovery template and release checks

- The owner subsequently authorized GitHub publication and Vercel production deployment, superseding the earlier local-only instruction. Production must match the pushed Git SHA; delivery records its status and public URL.
- `npm run lint`, `npm test` (21 checks), and the production build pass. Every college/course pair is checked against the seeded migration; department codes remain display labels.
- `tests/public-experience.mjs` passes for college/time/audience filters, approved-only reads without review metadata, eight showcase panels, read-only protected layouts, poster/detail focus, exact template copy/download and clipboard fallback, empty/error/loading states, countdowns, and reduced motion. Desktop/tablet/phone screenshots were inspected at 1440/960/390/320px for showcase light/dark layouts; email template also passed 1280/390/320px overflow checks.
- `tests/account-experience.mjs` passes for hydration with injected extension attributes, persisted/system theme, recovery request/leading-zero OTP/password update fixtures, rate-limit/restricted-delivery errors, admin table filters/locked reviewed rows, expanded submission and poster inspection, and short landscape navigation reaching Sign out. The sticky mobile menu now scrolls within the viewport.
- `tests/organizer-flow.mjs` passes creation/revision, definite and uncertain save cleanup, cancel/object URL cleanup, trusted scope and locked states, previews/focus, no preview writes, and light/dark responsive layouts.
- A root streaming loading boundary hid the public hero from browsers without JavaScript. It was removed; existing fetch skeletons, workspace loading panels and busy-button spinners remain. The no-JavaScript public-heading regression now passes.
- An independent source review found no remaining privacy, trusted-scope, hydration or recovery-source issue after the mobile navigation fix. No new dependency, schema/policy migration, real event fixture, real password change or reset email was introduced by this refresh. Real provider delivery and hosted recovery-template/OTP setup remain owner-operated checks; deploying the app does not apply those settings.

# Verification: organization access and event usability

## 2026-10-26: local organizer workspace and public presentation preview

- Replaced the separate organizer Create/My submissions navigation with one My events destination. Creation opens on demand; submissions use compact poster/schedule/status rows and All/Pending/Published/Rejected filters. Successful saves select Pending and close the editor.
- Reused EventCard and EventDetails for the live draft and saved card/details previews. Public presentation copies announcement fields only, omits review notes and sharing/calendar actions, and links to public details only for approved events. A preview performs no upload, database mutation, or public event lookup. No migration or backend permission change was needed.
- Expanded `tests/organizer-flow.mjs` passes existing submission/resubmission/cleanup/unknown-save checks plus unified navigation, status filters, public card aspect ratio/contained image, private preview content, card/detail switching, nested poster zoom/Escape, trapped/restored focus/body scrolling, live title/description/poster changes, invalid schedule preview, no preview writes, and cancellation/object URL cleanup. Desktop/tablet/phone and light/dark layouts fit through 320px; screenshots were visually inspected. Fixtures use the existing campus photo and remain isolated network interceptions.
- Review found that reopening the same active revision cleared its local image preview while its unchanged file input still held the replacement. A regression test reproduced the mismatch before the fix. Reopening now focuses the existing draft without clearing it; the expanded suite passes with the selected poster retained.
- Public-experience browser regression, lint, 18 unit tests and production build pass. The browser checks do not prove actual hosted password login or Storage transfer. No real submission was created and no event published. All changes remain local/uncommitted/unpushed; no Vercel deployment or hosted Auth setting update was made.

## 2026-10-26: local account and admin experience

Follow-up diagnosis: read-only hosted `/recover` Auth logs confirm `429 over_email_send_rate_limit`. Recovery now distinguishes email quota exhaustion, other request throttles, delivery restrictions and unknown errors; throttled failures start a browser retry cooldown without claiming the hosted quota has reset. The account browser suite passes these error branches and desktop/phone error layout. Lint and build pass. No new real email was requested, provider setting changed, commit pushed, or deployment made.

- This update remains local at the user's request. No commit, push, Vercel deployment, hosted Auth configuration update, database migration, or real password change was made.
- Read the repository data/workflow/context and bundled Next.js hydration-flash, client-component, script and loading guides. The reported body attributes identify Grammarly injection. Suppression is limited to root attributes: body for extensions and html for the deliberate pre-paint theme attribute; descendant hydration checks remain active.
- Added system/persisted light/dark appearance, existing Lucide icons, dismissible live-region toasts alongside durable feedback, and loading spinners/skeleton pulses that stop under reduced motion. Toast expiry pauses during pointer or keyboard interaction.
- Unified admin pending/history into Manage events with Pending, Published, Rejected and All filters. Pending-only review RPCs and the public Browse events destination are preserved. Keyboard focus returns to the submissions heading after a successful decision.
- `tests/account-experience.mjs` passes isolated browser fixtures for extension attributes/no hydration warnings, appearance persistence, responsive public/auth pages at 1280/390/320px, busy loading, code requests, six-digit recovery verification including leading zeroes, invalid codes, resend cooldown, password mismatch/server rejection/success, legacy root recovery redirects, abandoning recovery and signing in, email failure, admin filters/locks/approval/rejection validation, toast dismissal, and admin phone layout. Auth/email/review writes are intercepted; no real account is changed or emailed.
- Existing public-experience and organizer-flow suites pass, including rejected-event revisions, image cleanup and ambiguous save outcomes. Desktop/phone dark home/recovery/admin screenshots were visually inspected. Lint, 18 unit tests, and the production build pass.
- An independent review found a recovery flag that could prevent normal login after abandoning reset. Fresh `SIGNED_IN` clears it; the cancellation/sign-in browser case passes.

Still required before real email-code recovery: apply `supabase/templates/recovery.html` to hosted Reset Password email, confirm six-digit OTP length, and verify actual delivery/password change with an owner account. The connector cannot update these Auth settings. Some new Free projects require custom SMTP before template customization; see `PASSWORD_RECOVERY.md`. No real email, real password change, or new hosted authorization test was performed in this local UI update.

## 2026-10-26: public campus experience

- Followed the attached implementation brief and the saved public-experience plan. Read repository context/spec/design/data/methodology/later documents, public components, and bundled Next.js client/server, CSS, and metadata guides. No database policy, RPC, role, migration, privileged key, dependency, or workspace behavior was changed.
- Lint is clean; 18 unit tests and production build pass. Tests cover PHT date boundaries, featured/live selection, countdown boundaries, related-event scope/cap, calendar text injection/UTF-8 line folding/UTC dates, and approved-only anonymous metadata/error fallback.
- `tests/public-experience.mjs` passes isolated browser fixtures for populated discovery, search/filter persistence and course reset, time pills, minute refresh, countdown-to-live transitions, nested poster zoom/Escape/scroll lock, keyboard focus containment/return, refresh while preview is open, calendar download, native-share payload/cancellation mocks, clipboard/manual-copy fallback, related events, contact links, skeleton/error/empty states and reduced-motion changes. Fixture data exists only in isolated network interceptions; no public sample events were inserted.
- Screenshots of public home, event detail and contact were inspected at 1280px/390px. Home also fits at 320px. Real anonymous empty-home checks fit at 1280/960/768/390px. Nine key public text/background pairs pass 4.5:1; measured ratios range from 5.65:1 to 12.97:1. Dark-green home navigation/hero use gold focus outlines. Public action targets are at least 44px.
- Existing `tests/organizer-flow.mjs` regression suite passes, including rejected-event resubmission/cleanup/uncertain saves and organizer/admin/member desktop/phone views. `git diff -- supabase` is empty.
- Whole-change review found a result-wrapper remount that could disconnect a modal trigger during refresh. The wrapper now stays mounted; native browser animation preserves keyed cards. A fixture appends an event while preview is open and confirms the original trigger remains connected and receives focus on close. Reviewer confirmed the fix with no remaining important findings.
- Contact address, phone and email were reconciled with official university/corporate sources and the original `Khaos-s/Phinma-Event` repository. Its old contact page has placeholder location text; reviewed legacy files do not verify La Paz. The official Rizal Street/Iloilo City/postal-code address is shared by contact/footer. No legacy personal contact, account, credential or roster data was copied.

Not verified: the unavailable Claude artifact's exact pixels; importing downloads into real Google/Apple/Outlook calendars; native share sheets on physical phones; actual password login/Storage transfer. Populated public metadata is checked with unit fixtures because no published test event was created in the hosted database. Venue, registration and contact-form backends remain postponed in `LATER.md`. Production deployment verification is recorded in the delivery response.

## 2026-10-26: rejected-event revisions and visual refresh

- Bundled Next.js 16.4.2 guides read before edits: Server and Client Components; CSS for global/Tailwind styling.
- Additive migration `007_rejected_event_resubmission.sql` applied to hosted Supabase. Earlier migrations were not edited. UPDATE grants cover content columns only, RLS restricts both old/new rows to own rejected events/current organization, and the authenticated resubmission RPC controls the pending reset.
- All three hosted SQL suites pass, including new `rejected_event_resubmission.sql`: same-organization cross-owner denial, role revocation/assignment change, protected review/identity fields, invalid input, pending/approved locks, repeated requests, atomic reset, private pending state, and fresh administrator approval. All fixture identities/events roll back.
- `npm test`: 11 tests pass, including Philippine input round-tripping across a UTC year boundary. `npm run lint` and `npm run build` pass.
- `tests/organizer-flow.mjs` uses isolated browser fixtures for auth and organizer writes. Checked retained/replaced posters, failed RPC cleanup, successful-save old-poster cleanup, cleanup failure feedback, uncertain save responses, cancel/object-URL release, existing new-event submission, reduced motion, and mobile drawer dismissal. Uncertain responses keep posters; fixtures simulate a committed pending revision with a lost response and confirm no deletion.
- Home, directory, login, and organizer layouts checked at 1440, 768, 390, and 320px; administrator/member workspaces checked at desktop and phone widths. Fixed public-toolbar overflow at 320px. Screenshots were inspected for the public home and organizer revision screens; generated screenshots remain ignored in `.taste-skill/`.
- Taste inspector: 0 failures across 1440/768/390px. Its app-title-size warning refers to the deliberately larger public landing headline; working screens retain compact titles. Existing brand palette/type and campus image are reused; no new dependencies or fabricated public records.
- Security advisor: five deliberate authenticated security-definer APIs now include `resubmit_event`, each with empty search paths and checked access. Existing leaked-password-protection warning remains. No RLS-disabled tables or anonymously callable resubmission API were introduced.

Still not verified: real password login and real Storage transfer/deletion using an organizer and administrator account. Browser fixtures prove UI request ordering and error handling, not actual Storage transfer. Unknown save outcomes may leave a private orphan; retaining it prevents breaking a late-committing revision. Existing Auth signup/leaked-password settings and scale limitations remain as documented below.

## Earlier verification

Checked 2026-10-23. Scope: trusted organization/department access, administrator-only publication, local poster preview, collapsible phone filters, and full-details poster zoom.

## Executed checks

- `npm test`: 10 passing tests for role destinations/compatibility, time boundaries/invalid-date rendering, filters, poster limits, public field selection, and security headers.
- `npm run lint`: passed. Generated local QA artifacts in `.taste-skill/` are excluded alongside the existing generated build exclusions.
- `npm run build`: clean production build and TypeScript checks passed. A stale local Turbopack cache initially caused its CSS worker to exit; archiving the generated cache resolved this without a runtime/configuration change.
- Hosted `supabase/tests/organization_access.sql`: passed. Transaction-scoped council/staff identities verify trusted scope derivation, cross-organization/department denial, valid program pairs, private reads, metadata privilege denial, administrator-only review/publication, repeated decision denial, role revocation, and the legacy Storage role-helper bridge. Fixtures roll back.
- Hosted `supabase/tests/security_boundaries.sql`: passed for malformed input, private columns, scoped workspace reads, and Storage metadata policies. Organizer refresh/error cleanup and admin poster zoom also passed local browser assertions. See `AUDIT.md` for detailed evidence and limits.
- Hosted checks after rollback: one real organization, 16 academic programs, zero events and zero test Auth users. Anonymous callers cannot execute review or role-helper RPCs.
- Real anonymous browser reads of the approved event/organization join succeed and show an honest empty state.
- Local browser fixtures at desktop and 375px phone widths pass for council/staff forms, valid course choices, local preview/replacement/object-URL cleanup, invalid time rejection, submission identity, failed-insert cleanup, shared role routing, and failed membership checks.
- Local public fixtures pass for organizer UUID filtering, collapse/selection preservation, quick view/full details, and poster fit/zoom/scroll/Escape/focus restoration. Desktop and phone screenshots were visually inspected.

Browser fixtures intercept hosted writes and never create public sample events. They check UI behavior separately from the hosted database tests.

## Remaining boundaries and advisories

- Actual password sign-in and a real Supabase Storage upload followed by administrator approval still require an owner-operated workflow check. No production passwords were used or new real publishers invented.
- Only the existing CITE Council assignment is onboarded. Other councils/faculty/staff require approved organization names, department assignments, and existing Auth accounts; see `ORGANIZER_SETUP.md`.
- One organization per account and one course per event are supported. Specific program year structures remain unconfirmed beyond the provisional 1st–4th Year options.
- Supabase still flags four authenticated security-definer helpers/RPCs, including the scoped workspace reader. These are deliberate: empty search paths, trusted role/ownership checks, authenticated-only execution, and no browser UPDATE grant. See the [Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Existing Supabase Auth leaked-password protection is disabled; it was not changed in this task. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).
- API signup is enabled despite administrator-provisioned UI scope. The dashboard browser permission was denied, so this remains an owner setting action. Development-only dependency advisory, pagination, and operational checks are documented in `AUDIT.md`.

Deployment verification is recorded in the delivery message and Vercel's matching Git commit deployment.
