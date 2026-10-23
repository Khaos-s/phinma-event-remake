# Application and security audit — 2026-10-23

## Result and scope

Audited the Next.js source, Git history, production dependency graph, public HTTP/API surface, hosted Supabase schema/grants/RLS/RPCs/Storage policies, and desktop/phone user flows. Baseline commit: `fd5cad1`. Confirmed defects below were repaired, and migrations 005–006 were applied to hosted Supabase.

The application is suitable for continued internal testing. Broad launch still needs the hosted Auth configuration actions and an owner-operated real login/upload/review test below. This is an engineering audit with stated evidence boundaries, not a guarantee that every possible vulnerability is absent.

## Confirmed defects repaired

| Priority | Finding and reproduction | Repair |
| --- | --- | --- |
| P1 | An authenticated organizer could insert infinite or year-294276 timestamps directly. The date formatter then threw a RangeError, breaking the review queue. | Migration 005 restricts finite dates to years 0001–9999; formatting safely labels malformed values. |
| P2 | Trimmed-length checks accepted a one-character title/description followed by 10,000 spaces. | Raw text bounds now enforce title 200, description 5,000, review reason 1,000, and organization name 120 characters. |
| P2 | Approved-row SELECT exposed creator/reviewer account identifiers and review metadata. UI filtering alone could not prevent direct API access. | Migration 006 limits direct SELECT to announcement columns for both anonymous and authenticated roles. Full rows require `workspace_events()`, which checks the current trusted assignment and returns only the organizer's own rows or all rows for an administrator. Public clients select explicit fields. |
| P2 | Browser framing, content-type, referrer, permissions, and content-source headers were absent. | CSP, X-Frame-Options DENY, nosniff, no-referrer, restrictive Permissions-Policy, and disabled framework identification. Production CSP excludes unsafe-eval. |
| P2 | Failed poster cleanup after a failed insert was discarded. | The organizer sees the cleanup failure and is not told the event succeeded. |
| P2 | Organizer review status/reason stayed stale, and signed posters expired after an hour without refresh. | Manual refresh plus 60-second refresh, with stale-request ordering protection. |
| P3 | Administrators could not expand dense pending posters on a phone. | Existing poster fit/zoom dialog reused in the review workspace. |

Migration 005 also limits client INSERT privileges to submission fields. IDs, creation timestamps, and review state use database defaults/trusted operations.

## Permission results

| Operation | Visitor | Member | Organizer | Administrator |
| --- | --- | --- | --- | --- |
| Browse approved announcement fields | Yes | Yes | Yes | Yes |
| Read creator/reviewer metadata directly from the table | No | No | No | No |
| Read complete workspace submissions through RPC | Denied | No rows | Own rows | All rows |
| Submit an event | Denied | Denied | Own assigned organization/department only | Denied |
| Forge organization, department, or program | Denied | Denied | Denied | Not a submission role |
| Approve/reject | Denied | Denied | Denied | Pending rows only |
| Assign roles/create organizations through browser API | Denied | Denied | Denied | Denied; trusted Supabase setup only |
| Read pending poster | No | No | Own only | Yes |

All four exposed application tables retain RLS. User-editable metadata does not grant roles. Revoked assignments stop authorizing subsequent database operations. Storage remains private, own-path uploads are enforced, and public image reads require an approved event. Existing signed URLs remain bearer links until their one-hour expiry; revoking a role does not retract an already issued URL.

Public poster paths still contain a pseudonymous uploader UUID by design. A UUID is not a credential, and this does not expose account emails/passwords; do not describe the poster URL as anonymized.

## Authentication and missing pages

- One shared `/login` serves members, organizers, and administrators. Correct destinations, wrong-role redirects, sign-out, password visibility, mobile navigation, and account-load failure states pass browser fixture checks.
- A real hosted invalid-password probe returned `400 invalid_credentials` without a token. No real account passwords were used or changed.
- `/signup` and `/forgot-password` return 404 and have no dead navigation links. They are intentionally outside the accepted administrator-provisioned release; login directs users to their administrator.
- **Open P2: hosted API signup is enabled** (`disable_signup = false`), despite no signup UI. Email confirmation is enabled and anonymous sign-in is disabled. Database tests confirm a member cannot self-assign privileges, but unnecessary account creation/spam remains possible. In Supabase Authentication settings, disable new-user signups while retaining email/password sign-in and trusted account provisioning. Recheck `/auth/v1/settings` afterwards.
- **Open P2: leaked-password protection is disabled.** Enable it if supported by the project's plan, following [Supabase password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection). Do not change anyone's password as part of that setting update.
- The Supabase connector does not expose Auth setting updates. Chrome's saved origin permission denied observing the Supabase dashboard; no alternate browser or credential workaround was used. These two settings were not changed.

## Keys and sensitive data

- Scanned 19 baseline commits / 196 unique Git blobs for privileged Supabase key prefixes, private keys, GitHub token patterns, JWTs, and real account emails: no matches. `.env.local` is ignored; only the empty template is tracked.
- Vercel environment metadata lists only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in production/preview. Values were not printed or committed. The latter contains a browser publishable key; a publishable key is expected in browser code and is not a privileged secret.
- HTML and referenced JavaScript assets were checked for privileged-key/private-key/token patterns. `.env`, `.env.local`, `.git/config`, source paths, and package.json are not served. A sampled production JavaScript source map returned 404.
- Anonymous API probes cannot list role assignments, access Auth admin users, invoke the workspace/review RPCs, insert events, or select private creator/reviewer columns. Public announcement reads still succeed.
- No raw HTML injection sink, dynamic SQL built from browser input, or privileged client key was found in application source.

## Executed verification

- Node tests: 10 passed, covering roles, schedules/invalid-date rendering, filters, poster bounds, public field selection, and production header protections.
- ESLint and production build passed. Production desktop/mobile pages were rendered and local 375px/desktop screenshots were inspected.
- `supabase/tests/organization_access.sql`: authenticated council/staff scope, private reads, metadata privilege denial, administrator publication/rejection, repeated decisions, and revocation passed.
- `supabase/tests/security_boundaries.sql`: invalid schedule/text rejection, protected creation timestamp, private columns, scoped workspace access, and Storage metadata ownership/read/publication checks passed.
- Both SQL suites roll back every fixture. Final checks show zero events, zero stored posters, and zero synthetic test Auth users. No sample event was permanently published.
- Local browser fixtures passed public filtering/quick view/detail/zoom, role-specific login/routing/sign-out, organizer preview/validation/submission/error cleanup, review-status refresh, and administrator poster zoom. Hosted writes are intercepted in these fixtures.
- Known app routes, visible internal links, icons, fonts, styles, image optimizer URLs, and referenced scripts resolve. Missing/unpublished event IDs render an unavailable state; valid-looking unavailable IDs currently use a client-side soft 404 (HTTP 200 shell).
- The external university link returned 403 to the automated HTTP client. This is not evidence that the link is broken; browser accessibility of that external site was not confirmed during this audit.

## Remaining risks and checks

1. **Real end-to-end workflow:** an owner must sign in as organizer, upload a real poster, submit, confirm anonymous users cannot see it, then sign in as administrator and approve/reject. Verify published visibility and organizer feedback. Database and UI fixture tests are separate evidence and do not prove real password/Storage transfer together.
2. **Scale:** lists currently use a single PostgREST query without pagination. Hosted row limits may truncate future large histories/directories and derived counts. The hosted max-row value was not available in database settings. Add pagination/server filtering before a large rollout; current event count is zero.
3. **Operations:** no GitHub Actions quality gate or tested backup/restore drill is present. Vercel builds do not substitute for automated lint/tests. Runtime Auth rate-limit/CAPTCHA/MFA configuration and session revocation behavior were not independently verified; no load/brute-force test was performed.
4. **Dependencies:** `npm audit --omit=dev` reports zero findings. Full audit reports five high entries for one development-only ESLint → fast-glob → micromatch → braces advisory chain. No patched braces version is published. Do not apply npm's incompatible Next downgrade; track the [primary advisory](https://github.com/advisories/GHSA-vfj7-8cjw-p6xm). No untrusted user glob patterns reach this lint configuration.
5. **Deliberate Supabase warnings:** four authenticated security-definer functions are intentional (`has_role`, `approve_event`, `reject_event`, `workspace_events`). Empty search paths, role/ownership checks, anonymous execution revocation, and integration tests protect their boundaries. See the [Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable). Unused-index and multiple-permissive-SELECT performance notices are not authorization failures.
6. **CSP boundary:** static Next bootstrap scripts and existing inline styles require unsafe-inline. This policy blocks external script origins, frames, objects, and unexpected connections; it is not a nonce-based strict CSP. Move to nonces if the rendering/security requirements change.

## Deployment and recovery

GitHub main deploys to Vercel. Verify the delivery commit's production deployment is READY and the live alias serves the new headers/public queries. Migrations are additive; do not rewrite 001–006. If an application rollback is needed, keep a release compatible with restricted public columns and `workspace_events()`; an older wildcard-read client will fail closed. Restore a damaged schema/data set only from a verified owner backup; that procedure was not exercised here.
