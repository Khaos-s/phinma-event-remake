# PHINMA Event

The CITE Council pilot for PHINMA University of Iloilo. Visitors can view approved events at [phinma-event-remake.vercel.app](https://phinma-event-remake.vercel.app). A CITE organizer submits an event, and a PHINMA Event administrator approves or rejects it. Approval publishes the event immediately.

## Run locally

Use Node.js 24, then:

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local` using the project's Supabase URL and publishable key. The same two variables must be configured in Vercel. Never put a Supabase secret or service role key in this app.

The database setup is in `supabase/sql/001_cite_events.sql` and `supabase/sql/002_cleanup_unsubmitted_images.sql`, applied in order. Supabase Auth users need trusted `role_assignments` records for either `cite_organizer` or `event_admin`; the website cannot grant roles. See `docs/SPEC.md` for the workflow and access rules.

## Checks

```bash
npm run lint
npm run build
node --test src/lib/events.test.ts
```

The pilot uses the College of Information Technology and BSIT. Other councils, student rosters, and email notifications are later work.
