# PHINMA UI Event: project context

## Product and current scope

PHINMA UI Event is a university event board for PHINMA University of Iloilo. The first release supports CITE Council and BSIT. A council organizer submits an event once; a PHINMA Event administrator reviews it. Approval publishes it automatically. Visitors browse approved events without an account.

The source repository was an unfinished Flask/MySQL application. The remake uses Next.js App Router, React, TypeScript, the existing Tailwind UI components, hosted Supabase Auth/Postgres/Storage, and Vercel. Legacy student enrollment, scholarship hours, water reporting, relief operations, and other domains appearing in reference documents are not part of this application.

## Roles and destinations

| Account | Destination | Allowed work |
| --- | --- | --- |
| Signed-out visitor | `/` | Browse published events, search, and filter by time and year |
| Registered member without a privileged grant | `/account` | View own account and browse events |
| `cite_organizer` | `/organizer` | Submit a pending event and view own submissions |
| `event_admin` | `/admin` | Read submissions and approve or reject pending events |

Everyone uses `/login`. Roles are trusted assignments in the database; no role chooser, editable profile field, or browser state grants permission. RLS and role-checking RPCs enforce the permissions. The client session provider personalizes navigation and hides inaccessible workspaces.

## Runtime and delivery

- Production: [phinma-ui-event.vercel.app](https://phinma-ui-event.vercel.app/).
- Repository: `Khaos-s/phinma-event-remake`; pushes to `main` deploy through Vercel.
- Hosted Supabase project reference: `ulymtioaxraqvoqongrj`.
- Browser configuration uses the project URL and publishable key only. `.env.local` is ignored. Environment variable names are in `.env.example`.
- Node.js 24; use `npm ci`, `npm run dev`, `npm run lint`, `npm run build`, and the Node test commands in the README.
- Do not put account email addresses, passwords, secret keys, or privileged tokens in committed fixtures or documents.

## Structure

- `src/app/`: public board, shared login, member account, organizer form, administrator queue.
- `src/components/`: session provider, public header/footer, workspace shell, event cards/status, and UI primitives.
- `src/lib/events.ts`: shared event types, time conversion, audience/search filters, and signed image URL loading.
- `src/lib/roles.ts`: safe role resolution and landing destinations. Database authorization is independent of this UI helper.
- `supabase/sql/`: applied numbered schema and storage policy changes. Add a new migration for changes.
- `docs/SPEC.md`: accepted behavior; `DATA_MODEL.md`: schema/access; `METHODOLOGY.md`: workflow and calculations.

## Design

Use PHINMA green and gold, neutral light surfaces, clear text, and real campus imagery. The supplied HTML design board informs spacing, typography, components, and the shared sidebar; its example product, users, data, and business rules are references only. Image provenance is in `IMAGE_SOURCES.md`. All counts come from actual visible records. Keep desktop and mobile navigation functional and accessible.

## Current limitations

The university's existing approval process has not been observed in person. Real account sign-in and a live submission/approval test still need an owner-operated check. Email notifications, other councils, public registration, event editing/resubmission, and enrollment records are outside the current pilot. See `LATER.md` before expanding scope.

## Reuse

The generic templates in `docs/reusable/` are for starting another project. Fill them with that project's facts; they do not define new PHINMA functionality.
