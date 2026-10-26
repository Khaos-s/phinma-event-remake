# PHINMA UI Event: project context

## Product and current scope

PHINMA UI Event is a university event board for PHINMA University of Iloilo. Authorized council, faculty, and staff organizers submit for their assigned organization and department. A PHINMA Event administrator reviews each submission; approval publishes it automatically. Visitors browse approved events without an account. The public department/course catalog follows the university's college-programs directory. The existing CITE Council test assignment is preserved; additional real publishers require trusted setup described in `ORGANIZER_SETUP.md`.

The source repository was an unfinished Flask/MySQL application. The remake uses Next.js App Router, React, TypeScript, the existing Tailwind UI components, hosted Supabase Auth/Postgres/Storage, and Vercel. Legacy student enrollment, scholarship hours, water reporting, relief operations, and other domains appearing in reference documents are not part of this application.

## Roles and destinations

| Account | Destination | Allowed work |
| --- | --- | --- |
| Signed-out visitor | `/`, `/events`, `/events/[id]`, `/contact` | Browse/preview approved events, use schedule/audience filters, discover featured/live events, download calendar files, share details, and find university contact channels |
| Registered member without a privileged grant | `/account` | View own account and browse events |
| `organizer` | `/organizer` | Submit events, view own submissions, and revise/resubmit own rejected events in the assigned organization |
| `event_admin` | `/admin` | Read submissions and approve or reject pending events |

Everyone uses `/login`. Roles and organization membership are trusted assignments in the database; no role chooser, editable profile field, or browser state grants permission. RLS, foreign keys, a scope trigger, and role-checking review RPCs enforce permissions. The legacy `cite_organizer` spelling resolves to scoped organizer access for compatibility with existing accounts.

`/forgot-password` requests and verifies an emailed six-digit Supabase recovery code; `/reset-password` updates the authenticated user's password. Hosted email configuration is an outstanding owner action documented in `PASSWORD_RECOVERY.md`. Public registration remains outside scope. Appearance supports system/persisted light or dark themes; shared toasts accompany existing inline feedback. Administrators use one Manage events table with status filters and expandable full-submission/poster inspection, and a separate Browse events link.

Organizers use one **My events** workspace. **Create event** opens a centered two-step proposal flow: enter details, then choose **Next: preview event** for a private full-details screen before the final submission; each saved submission offers card/details preview and only rejected rows offer editing. Preview reuses public components, excludes review notes and sharing actions, and uploads/publishes nothing. Successful saves close the editor and select Pending. The owner authorized GitHub publication and production deployment on 26 October 2026; the matching deployment is checked during delivery.

## Runtime and delivery

- Production: [phinma-ui-event.vercel.app](https://phinma-ui-event.vercel.app/).
- Repository: `Khaos-s/phinma-event-remake`; pushes to `main` deploy through Vercel.
- Hosted Supabase project reference: `ulymtioaxraqvoqongrj`.
- Browser configuration uses the project URL and publishable key only. `.env.local` is ignored. Environment variable names are in `.env.example`.
- Node.js 24; use `npm ci`, `npm run dev`, `npm run lint`, `npm run build`, and the Node test commands in the README.
- Do not put account email addresses, passwords, secret keys, or privileged tokens in committed fixtures or documents.

## Structure

- `src/app/`: public home, all-events directory, individual event details, contact page, shared login, member account, organizer form, administrator queue.
- `src/lib/academics.ts`: sourced college/program catalog; provenance and naming notes in `docs/ACADEMIC_REFERENCE.md`.
- `src/components/`: session provider, public header/footer, workspace shell, event cards/status, and UI primitives.
- `src/lib/events.ts`: shared event types and organization relation selection, time conversion, audience/search filters, and signed image URL loading.
- `src/lib/public-events.ts`: approved-only featured/live/related selection, countdown and Philippine date tiles. `calendar.ts` exports escaped, UTF-8-folded UTC calendar files. `public-event-metadata.ts` reads only approved title/description anonymously for per-event metadata. `site.ts` shares verified public university contact facts.
- `src/components/featured-event.tsx`, `happening-now.tsx`, and `event-actions.tsx`: derived public discovery and browser calendar/share actions. `src/hooks/use-scroll-reveal.ts` reveals content once and respects reduced motion.
- Public event reads select announcement fields explicitly; organizer/admin full records come from the role-checked `workspace_events()` RPC. Column grants protect private creator/reviewer metadata independently of UI selection.
- `src/lib/posters.ts`: shared poster MIME/size validation. Pre-submit previews use local object URLs with cleanup; full public details support a poster zoom dialog.
- `src/lib/roles.ts`: safe role resolution and landing destinations. Database authorization is independent of this UI helper.
- `supabase/sql/`: applied numbered schema and storage policy changes. Add a new migration for changes.
- `docs/SPEC.md`: accepted behavior; `DATA_MODEL.md`: schema/access; `METHODOLOGY.md`: workflow and calculations.

## Design

Use PHINMA green and gold, neutral light surfaces, clear text, and real campus imagery. The supplied HTML design board informs spacing, typography, components, and the shared sidebar; its example product, users, data, and business rules are references only. Image provenance is in `IMAGE_SOURCES.md`. All counts come from actual visible records. Keep desktop and mobile navigation functional and accessible.

Public discovery now uses a full-width deep-green hero, white university mark, centered university crest/wordmark, subtle campus photograph, always-visible search, collapsible audience filters, compact poster-led date-tile cards, and sliding time pills. Featured/live selections derive from approved schedules and the shared minute clock; featured content is omitted when unavailable. Public details/quick view reuse poster zoom, include calendar/share actions, and show up to three related approved events. Contact and footer share the official address with postal code 5000; `La Paz` is omitted because the official university address does not list it. No new data column, policy, RPC, role, or dependency was added for this public update.

## Current limitations

The university's existing approval process has not been observed in person. Real password sign-in and Storage upload still need an owner-operated check; database role/publication tests use transaction-scoped identities and roll back all fixtures. One organization per organizer account and one course per event are supported. Own rejected-event revision/resubmission is supported; pending and approved events stay locked. Multi-organization memberships, email notifications, public registration, published-event editing, and enrollment records remain later work. See `LATER.md` before expanding scope.

Read `AUDIT.md` for the 2026-10-23 end-to-end audit. Hosted API signup remains enabled and leaked-password protection disabled; Chrome denied dashboard access, and the connector cannot update Auth settings. Lists are not paginated yet. Do not claim those gaps or real password/upload verification are complete.

## Reuse

The generic templates in `docs/reusable/` are for starting another project. Fill them with that project's facts; they do not define new PHINMA functionality.

## Multi-screen showcase and catalog labels

`/showcase` presents eight responsive bento panels for navigation, campus/search, live/featured, discovery, details/poster, organizer form, administrator review, and contact/identity. Its only event query explicitly selects approved public fields. Organizer/admin fragments are disabled, read-only layout previews linking to the actual protected workspaces; no private workspace rows are requested. Empty/error/loading states use real availability. Details/poster/calendar/share actions reuse public components. `/email-template` previews and copies/downloads the exact static recovery HTML, with a six-dot preview and an unchanged `{{ .Token }}` in its source. This page does not configure Supabase or send email.

Public and workspace canvases use canonical tokens and existing fonts. The shared public header is sticky white in light mode, and the forest footer has a gold top border; dark mode remains supported. College chips and coded course labels preserve the database catalog and trusted organizer assignment. The architectural hero image is sourced from the official facilities page. The owner subsequently authorized GitHub publication and Vercel production deployment. Hosted Auth template/settings still require owner setup.

The 26 October image/Google Sites design reference informs the centered campus identity, compact four-column desktop discovery grid, forest/gold spotlight, full poster/details treatment, university footer columns, and centered two-step organizer proposal. Its sample events, role simulator, invented statistics, and extra business fields do not enter the real application. In the organizer flow, the details form remains mounted while hidden on preview so Back retains fields and the selected File/object URL. Preview uploads and writes nothing. Manual Refresh reveals current submissions without discarding that draft, including after an uncertain save response; refresh errors stay visible.
