# PHINMA UI Event

The event board for PHINMA University of Iloilo. Visitors can browse approved events at [phinma-ui-event.vercel.app/events](https://phinma-ui-event.vercel.app/events), filter by department/course/organizer/year/time, open a quick-view popup, and follow its full-details link. Authorized council, faculty, and staff organizers submit for their assigned organization and department. The PHINMA Event administrator reviews each proposal; approval makes it public.

## Run locally

Use Node.js 24, then:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the project's Supabase URL and publishable key. The same two variables must be configured in Vercel. Never put a Supabase secret or service role key in this app.

The four numbered database migrations in `supabase/sql/` are applied in order. All registered users share `/login`. Accounts with trusted grants for `organizer` (including legacy `cite_organizer`) or `event_admin` open their own workspaces; other accounts receive member access at `/account`. The website cannot grant roles. See `docs/ORGANIZER_SETUP.md` for publisher onboarding, `docs/SPEC.md` for the workflow, and `docs/IMAGE_SOURCES.md` for image credits.

## Checks

```bash
npm run lint
npm run build
npm test
```

The university department/course catalog is sourced in `docs/ACADEMIC_REFERENCE.md`. The original CITE test assignment is preserved. The organizer form includes a local poster preview; phone filters collapse; full-detail posters can be zoomed. Student rosters and email notifications are later work.

Database RLS tests are in `supabase/tests/organization_access.sql`; all test identities/events are rolled back. See `docs/VERIFICATION.md` for the verification boundaries.

Start with `docs/CONTEXT.md` for the code map, `docs/DATA_MODEL.md` for permissions, and `docs/METHODOLOGY.md` for the event workflow. `docs/DESIGN.md` explains how the supplied visual reference was adapted. Reusable agent/context/data/workflow templates and a general engineering guide are in `docs/reusable/`; they are references for future projects, not extra application requirements.
