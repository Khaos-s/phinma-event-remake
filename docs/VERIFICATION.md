# Verification: organization access and event usability

Checked 2026-10-23. Scope: trusted organization/department access, administrator-only publication, local poster preview, collapsible phone filters, and full-details poster zoom.

## Executed checks

- `npm test`: 7 passing tests for role destinations/compatibility, event time boundaries and filters, and poster type/size validation.
- `npm run lint`: passed. Generated local QA artifacts in `.taste-skill/` are excluded alongside the existing generated build exclusions.
- `npm run build`: clean production build and TypeScript checks passed. A stale local Turbopack cache initially caused its CSS worker to exit; archiving the generated cache resolved this without a runtime/configuration change.
- Hosted `supabase/tests/organization_access.sql`: passed. Transaction-scoped council/staff identities verify trusted scope derivation, cross-organization/department denial, valid program pairs, private reads, metadata privilege denial, administrator-only review/publication, repeated decision denial, role revocation, and the legacy Storage role-helper bridge. Fixtures roll back.
- Hosted checks after rollback: one real organization, 16 academic programs, zero events and zero test Auth users. Anonymous callers cannot execute review or role-helper RPCs.
- Real anonymous browser reads of the approved event/organization join succeed and show an honest empty state.
- Local browser fixtures at desktop and 375px phone widths pass for council/staff forms, valid course choices, local preview/replacement/object-URL cleanup, invalid time rejection, submission identity, failed-insert cleanup, shared role routing, and failed membership checks.
- Local public fixtures pass for organizer UUID filtering, collapse/selection preservation, quick view/full details, and poster fit/zoom/scroll/Escape/focus restoration. Desktop and phone screenshots were visually inspected.

Browser fixtures intercept hosted writes and never create public sample events. They check UI behavior separately from the hosted database tests.

## Remaining boundaries and advisories

- Actual password sign-in and a real Supabase Storage upload followed by administrator approval still require an owner-operated workflow check. No production passwords were used or new real publishers invented.
- Only the existing CITE Council assignment is onboarded. Other councils/faculty/staff require approved organization names, department assignments, and existing Auth accounts; see `ORGANIZER_SETUP.md`.
- One organization per account and one course per event are supported. Specific program year structures remain unconfirmed beyond the provisional 1st–4th Year options.
- Supabase still flags the three authenticated security-definer helpers/RPCs. These are deliberate: empty search paths, trusted role checks, authenticated-only execution, and no browser UPDATE grant. See the [Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable).
- Existing Supabase Auth leaked-password protection is disabled; it was not changed in this task. See [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

Deployment verification is recorded in the delivery message and Vercel's matching Git commit deployment.
