# PHINMA UI Event

The event board for PHINMA University of Iloilo. Visitors can browse approved events at [phinma-ui-event.vercel.app/events](https://phinma-ui-event.vercel.app/events), filter by department/course/organizer/year/time, open a quick-view popup, and follow its full-details link. The first authorized publishing workflow uses a CITE organizer and a PHINMA Event administrator. Approval makes an event public.

## Run locally

Use Node.js 24, then:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the project's Supabase URL and publishable key. The same two variables must be configured in Vercel. Never put a Supabase secret or service role key in this app.

The database setup is in `supabase/sql/001_cite_events.sql` and `supabase/sql/002_cleanup_unsubmitted_images.sql`, applied in order. All registered users share `/login`. Accounts with trusted `role_assignments` records for `cite_organizer` or `event_admin` open their own workspaces; other accounts receive member access at `/account`. The website cannot grant roles. See `docs/SPEC.md` for the workflow and access rules, and `docs/IMAGE_SOURCES.md` for university image credits.

## Checks

```bash
npm run lint
npm run build
npm test
```

The university department/course filter catalog is sourced in `docs/ACADEMIC_REFERENCE.md`. Website publishing currently uses the College of Information Technology and BSIT pilot. Other publishing organizations, student rosters, and email notifications are later work.

Start with `docs/CONTEXT.md` for the code map, `docs/DATA_MODEL.md` for permissions, and `docs/METHODOLOGY.md` for the event workflow. `docs/DESIGN.md` explains how the supplied visual reference was adapted. Reusable agent/context/data/workflow templates and a general engineering guide are in `docs/reusable/`; they are references for future projects, not extra application requirements.
