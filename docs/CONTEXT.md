# PHINMA UI Event: project context

## Product and current scope

PHINMA UI Event is a university event board for PHINMA University of Iloilo. Authorized council, faculty, and staff organizers submit for their assigned organization and department. A PHINMA Event administrator reviews each submission; approval publishes it automatically. Visitors browse approved events without an account. The public department/course catalog follows the university's college-programs directory. The existing CITE Council test assignment is preserved; additional real publishers require trusted setup described in `ORGANIZER_SETUP.md`.

The source repository was an unfinished Flask/MySQL application. The remake uses Next.js App Router, React, TypeScript, the existing Tailwind UI components, hosted Supabase Auth/Postgres/Storage, and Vercel. Legacy student enrollment, scholarship hours, water reporting, relief operations, and other domains appearing in reference documents are not part of this application.

## Roles and destinations

| Account | Destination | Allowed work |
| --- | --- | --- |
| Signed-out visitor | `/`, `/events`, `/events/[id]` | Browse and preview published events, open full details, and filter by time, department, course, organizer, and year |
| Registered member without a privileged grant | `/account` | View own account and browse events |
| `organizer` | `/organizer` | Submit events, view own submissions, and revise/resubmit own rejected events in the assigned organization |
| `event_admin` | `/admin` | Read submissions and approve or reject pending events |

Everyone uses `/login`. Roles and organization membership are trusted assignments in the database; no role chooser, editable profile field, or browser state grants permission. RLS, foreign keys, a scope trigger, and role-checking review RPCs enforce permissions. The legacy `cite_organizer` spelling resolves to scoped organizer access for compatibility with existing accounts.

## Runtime and delivery

- Production: [phinma-ui-event.vercel.app](https://phinma-ui-event.vercel.app/).
- Repository: `Khaos-s/phinma-event-remake`; pushes to `main` deploy through Vercel.
- Hosted Supabase project reference: `ulymtioaxraqvoqongrj`.
- Browser configuration uses the project URL and publishable key only. `.env.local` is ignored. Environment variable names are in `.env.example`.
- Node.js 24; use `npm ci`, `npm run dev`, `npm run lint`, `npm run build`, and the Node test commands in the README.
- Do not put account email addresses, passwords, secret keys, or privileged tokens in committed fixtures or documents.

## Structure

- `src/app/`: public home, all-events directory, individual event details, shared login, member account, organizer form, administrator queue.
- `src/lib/academics.ts`: sourced college/program catalog; provenance and naming notes in `docs/ACADEMIC_REFERENCE.md`.
- `src/components/`: session provider, public header/footer, workspace shell, event cards/status, and UI primitives.
- `src/lib/events.ts`: shared event types and organization relation selection, time conversion, audience/search filters, and signed image URL loading.
- Public event reads select announcement fields explicitly; organizer/admin full records come from the role-checked `workspace_events()` RPC. Column grants protect private creator/reviewer metadata independently of UI selection.
- `src/lib/posters.ts`: shared poster MIME/size validation. Pre-submit previews use local object URLs with cleanup; full public details support a poster zoom dialog.
- `src/lib/roles.ts`: safe role resolution and landing destinations. Database authorization is independent of this UI helper.
- `supabase/sql/`: applied numbered schema and storage policy changes. Add a new migration for changes.
- `docs/SPEC.md`: accepted behavior; `DATA_MODEL.md`: schema/access; `METHODOLOGY.md`: workflow and calculations.

## Design

Use PHINMA green and gold, neutral light surfaces, clear text, and real campus imagery. The supplied HTML design board informs spacing, typography, components, and the shared sidebar; its example product, users, data, and business rules are references only. Image provenance is in `IMAGE_SOURCES.md`. All counts come from actual visible records. Keep desktop and mobile navigation functional and accessible.

## Current limitations

The university's existing approval process has not been observed in person. Real password sign-in and Storage upload still need an owner-operated check; database role/publication tests use transaction-scoped identities and roll back all fixtures. One organization per organizer account and one course per event are supported. Own rejected-event revision/resubmission is supported; pending and approved events stay locked. Multi-organization memberships, email notifications, public registration, published-event editing, and enrollment records remain later work. See `LATER.md` before expanding scope.

Read `AUDIT.md` for the 2026-10-23 end-to-end audit. Hosted API signup remains enabled and leaked-password protection disabled; Chrome denied dashboard access, and the connector cannot update Auth settings. Lists are not paginated yet. Do not claim those gaps or real password/upload verification are complete.

## Reuse

The generic templates in `docs/reusable/` are for starting another project. Fill them with that project's facts; they do not define new PHINMA functionality.
