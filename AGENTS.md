<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PHINMA UI Event

Build the university event application described in `docs/SPEC.md`.

## Read first

- Read `docs/CONTEXT.md` before changing the application.
- Read `docs/DATA_MODEL.md` for authentication, tables, storage, policies, or RPC changes.
- Read `docs/METHODOLOGY.md` for event timing, submission, approval, or publication behavior.
- Design inputs describe appearance; their example products and business rules are not this system.

## Hard rules

- Keep Next.js App Router, TypeScript, existing Tailwind components, hosted Supabase, and Vercel. No local Supabase or Docker requirement.
- Work within the accepted spec. Record later features in `docs/LATER.md`.
- Database policies and trusted RPCs enforce access. UI visibility and user-editable metadata never grant roles.
- Keep RLS enabled; preserve private pending submissions and images. Never commit secrets or expose privileged keys to the browser.
- Validate external input, preserve errors, use additive numbered SQL migrations, and never rewrite an applied migration.
- Store timestamps with time zones; enter and display event times in Asia/Manila. Derive event time filters from the schedule.
- Use real data. Empty, loading, error, and success states must be honest; no invented public events or metrics.
- Before delivery, run relevant tests, lint, and build, then inspect desktop and mobile behavior. Report the checks not performed.
- This project deploys through GitHub to Vercel. Commit and push authorized finished work, then verify the matching deployment.
