# PHINMA UI academic filter reference

Rechecked 26 October 2026 against the university's dedicated [College Programs listing](https://ui.phinma.edu.ph/academics/?tab=college-programs). This page provides college/program groupings; the homepage summary contains different broad group names, so the dedicated listing is the filter source.

| Display code | Department | Program codes in this application |
| --- | --- | --- |
| COM | College of Management | BSHM, BSTM, BSBA |
| COA | College of Accountancy | BSA, BSAIS |
| COED | College of Education | BEED, BSED, BSNED |
| CCJE | College of Criminal Justice Education | BSCRIM |
| COE | College of Engineering | BSCE, BSME |
| CAHS | College of Allied Health Sciences | BSN, BSP, ABPSYCH |
| CITE | College of Information Technology | BSIT |
| CME | College of Maritime Education | BSMARE |

Full program labels are in `src/lib/academics.ts`. Codes are application identifiers, not a claim that every abbreviation is an official university code. Program grouping follows the dedicated listing. Special Needs Education uses the degree description's name; the source heading and description differ. BSBA majors Marketing Management/Financial Management and BSED English/Filipino are listed on the source page but remain grouped under their degree programs for event filtering.

This undergraduate catalog supplies browsing options and seeds the database's valid course/department pairs in migration 003. It does not create events, enroll students, assign accounts, or grant publishing access. No other council names or staff organizations have been invented. Organizers come from trusted organization records; CITE Council is the only seeded organization. See `ORGANIZER_SETUP.md` for onboarding real publishers.

The existing audience selector remains all college years or years 1–4. It is the accepted pilot event-audience setting, not a claim that every listed degree has the same duration. Senior high, graduate studies, training programs, and major-specific filters are outside this college release.

## Original repository cross-check

The owner's [original Phinma-Event repository](https://github.com/Khaos-s/Phinma-Event), main commit `89fb8708c7dc8416aae3c86fc2c1ce79df19625b`, was checked on 26 October 2026. Its `home.html` and `hrmlcss/profile.html` mention BSIT/HTM/CRIM, and `old/templates/index.html` lists ten programs without a complete college mapping. The official university listing above supplies the eight-college/sixteen-program grouping. No legacy student records or credentials were imported.

The new college codes are display labels. Full department names and course codes remain the stored values used by migration 003, organization assignments, and course/department foreign keys. A catalog regression test checks every pair against that migration. For example, CITE still stores `College of Information Technology` and permits BSIT; adding a label grants no publishing role. Organizer creation shows only the trusted assignment's courses.
