# PHINMA UI reference for the event remake

Checked 2026-10-21 against the official [PHINMA University of Iloilo Academics page](https://ui.phinma.edu.ph/academics/?tab=college-programs) and [Student Life page](https://ui.phinma.edu.ph/student-life/).

## College groupings and programs

Use the names below as reference data for department and program choices. The Academics page calls these groupings *colleges*; the app can call them departments in its interface if that is the language organizers use.

| College on the official site | Programs listed |
| --- | --- |
| College of Management | Bachelor of Science in Hospitality Management; Bachelor of Science in Tourism Management; Bachelor of Science in Business Administration |
| College of Accountancy | Bachelor of Science in Accountancy; Bachelor of Science in Accounting Information System |
| College of Education | Bachelor of Elementary Education; Bachelor of Secondary Education; Bachelor of Science in Special Needs Education |
| College of Criminal Justice Education | Bachelor of Science in Criminology |
| College of Engineering | Bachelor of Science in Civil Engineering; Bachelor of Science in Mechanical Engineering |
| College of Allied Health Sciences | Bachelor of Science in Nursing; Bachelor of Science in Pharmacy; Bachelor of Arts in Psychology |
| College of Information Technology | Bachelor of Science in Information Technology |
| College of Maritime Education | Bachelor of Science in Marine Engineering |

The site's [homepage](https://ui.phinma.edu.ph/) uses a different, broader set of labels for undergraduate programs. Use the detailed Academics list above for the first app choices; verify any later naming changes before updating reference data.

## Year levels and organizers

- The Academics page identifies Junior High School as Grades 7–10 and Senior High School as Grades 11–12. The first release discussed here is for college events.
- The page describes several college programs as four-year courses, but does not give a year-level list or duration for every program. The old prototype's 1st–4th Year selector is a useful starting assumption, not a confirmed rule for all programs.
- The [Student Life page](https://ui.phinma.edu.ph/student-life/) lists some organizations, including the Tactical Group in Criminal Justice Education, but does not list every department council. The CITE Council example comes from the project owner; council names and who may publish events need confirmation before seeding them.

## Implications for the first release

- Start with an event owned by one organizing college or its council. Reuse the official college and program names rather than the legacy app's three hard-coded BSIT, HTM, and CRIM choices.
- Treat program and year level as optional event audience filters until organizers confirm how they target announcements. Do not require a student roster to publish an event.
- Let authenticated, approved organizers manage only their own college's events. Decide whether published events are public and whether council posts require staff approval before writing access policies.
