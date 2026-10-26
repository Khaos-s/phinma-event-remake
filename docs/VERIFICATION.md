# Verification: organization access and event usability

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
