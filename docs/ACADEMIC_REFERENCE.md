# PHINMA UI academic filter reference

Checked 23 October 2026 against the university's dedicated [College Programs listing](https://ui.phinma.edu.ph/academics/?tab=college-programs). This page provides college/program groupings; the homepage summary contains different broad group names, so the dedicated listing is the filter source.

| Department | Program codes in this application |
| --- | --- |
| College of Management | BSHM, BSTM, BSBA |
| College of Accountancy | BSA, BSAIS |
| College of Education | BEED, BSED, BSNED |
| College of Criminal Justice Education | BSCRIM |
| College of Engineering | BSCE, BSME |
| College of Allied Health Sciences | BSN, BSP, ABPSYCH |
| College of Information Technology | BSIT |
| College of Maritime Education | BSMARE |

Full program labels are in `src/lib/academics.ts`. Codes are application identifiers, not a claim that every abbreviation is an official university code. Program grouping follows the dedicated listing. Special Needs Education uses the degree description's name; the source heading and description differ. BSBA majors Marketing Management/Financial Management and BSED English/Filipino are listed on the source page but remain grouped under their degree programs for event filtering.

This undergraduate catalog supplies browsing options and seeds the database's valid course/department pairs in migration 003. It does not create events, enroll students, assign accounts, or grant publishing access. No other council names or staff organizations have been invented. Organizers come from trusted organization records; CITE Council is the only seeded organization. See `ORGANIZER_SETUP.md` for onboarding real publishers.

The existing audience selector remains all college years or years 1–4. It is the accepted pilot event-audience setting, not a claim that every listed degree has the same duration. Senior high, graduate studies, training programs, and major-specific filters are outside this college release.
