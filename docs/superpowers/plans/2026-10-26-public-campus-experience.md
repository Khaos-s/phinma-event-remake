# Public campus experience implementation plan

Goal: improve public discovery and event details using approved announcement fields only.
Stack: existing Next.js App Router, TypeScript, Tailwind v4, Supabase reads, native browser APIs and CSS. No dependency or migration.

Approved brief: user attachment `Pasted text.txt`, supplied 2026-10-26. Follow its hero, arch crop, search, card, featured/live, details, contact, accessibility and motion requirements. Preserve private workspaces and database behavior.

- [x] 1. Public design tokens and layout foundations in `src/app/globals.css`.
- [x] 2. Hero and responsive search/disclosures in `src/components/event-browser.tsx`; themed public header.
- [x] 3. Public-only poster/date cards and time pills in event browser/card; keep workspace cards unchanged.
- [x] 4. Derived featured selection and countdown in `src/lib/public-events.ts` and `src/components/featured-event.tsx` with boundary tests.
- [x] 5. Ongoing strip in `src/components/happening-now.tsx`, sharing the existing minute clock.
- [x] 6. Details/actions/related events and public metadata: existing detail components/route, `event-actions.tsx`, `calendar.ts`, `public-event-metadata.ts`; test calendar escaping, metadata privacy, and nested-dialog focus.
- [x] 7. Public `src/app/contact/page.tsx`; shared verified facts in `src/lib/site.ts`; contact navigation/footer links.
- [x] 8. CSS motion/skeletons and a small one-shot reveal hook. Respect reduced motion; content stays visible without JS.
- [x] 9. Keyboard/1280px/390px browser checks, final build, documentation and review. GitHub push and matching Vercel deployment are verified in the delivery response.

Run lint and unit tests after each numbered step. Run a final production build and browser checks with private writes intercepted. Do not create hosted sample events.

Risks: calendar escaping/folding, nested dialog focus/scroll restoration, live refresh boundaries, and filter persistence. Test each. Venue, registration and a contact backend are later work.

Ruling: use the university's verified address, `Rizal Street, Iloilo City, Iloilo 5000, Philippines`, without unverified `La Paz`. Official contact: https://ui.phinma.edu.ph/about-us/ ; corporate email source: https://www.phinma.com.ph/contact-us-2/ . The external Claude concept could not be read; the user's detailed visual brief is authoritative.

Follow-up: owner supplied https://github.com/Khaos-s/Phinma-Event . Inspected its main tree, home/Flask templates, and old contact prototype. The latter has placeholder location text; reviewed files do not verify La Paz. Retain official address. No legacy personal/account data is copied.
