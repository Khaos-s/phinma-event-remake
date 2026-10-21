# CITE Council event pilot — decisions

These are product-owner decisions from 2026-10-21. They describe the first release; they are not claims about an existing PHINMA UI policy. The official college and program names are recorded in [PHINMA_REFERENCE.md](PHINMA_REFERENCE.md).

## People and approval

- **CITE Council organizer:** The CITE Council chairman is the first event organizer. An authorized council account signs in, creates an event proposal, and submits it for review.
- **PHINMA Event administrator:** A central administrator account reviews proposals. Only this role may approve or reject them. Approval publishes an event automatically.
- **Public visitor:** Anyone may view approved events without signing in. Unapproved proposals and review notes are private.
- The first release covers CITE Council events for the College of Information Technology and its Bachelor of Science in Information Technology (BSIT) program. The school website calls the grouping a *college*; the product owner calls it a *department* and the council *CITE Council*.

## Event and review flow

1. The organizer enters one event image (poster or logo), event name, description, start date and time, end date and time, department, course, and target year level.
2. The organizer saves a draft or submits it. Submission moves it to **pending review**. A pending event is visible to its organizer and the administrator, not to the public.
3. Submission adds the proposal to the administrator's in-app review queue and its pending count. The administrator reads the full proposal and approves or rejects it. Rejection includes a reason the organizer can read. An approved event appears on the public event page immediately.
4. An organizer may revise a rejected proposal and submit it again. Changes to an approved event require a new review before the changes appear publicly; the initial build may simply lock approved events and defer editing them.

The year choice is **All college years** by default, with 1st, 2nd, 3rd, and 4th Year as provisional specific choices for BSIT. The product owner said an event can be for all college years. PHINMA UI's official site does not provide a definitive year-level taxonomy for every program, so these choices must be confirmed before expanding beyond BSIT. Department and course are fixed to the CITE/BSIT pilot values initially; the form still shows them so the audience is clear.

The public event page offers **Upcoming**, **Ongoing**, and **Past** filters. Classification uses the event's start and end instants in the Asia/Manila time zone for display. Upcoming means start is later than now; ongoing means start is at or before now and end is after now; past means end is at or before now. Requiring an end time makes this classification unambiguous. Approval state and time classification are separate: only approved events appear in any public filter.

## Minimum screens

- Public event list with status filters and event details, including the image, audience, and schedule.
- Organizer sign-in, event form, and own-submissions list with review status and rejection reason.
- Administrator sign-in and review queue with a pending count, full proposal, approval, and rejection.

## Data and access boundaries

- Use Supabase Auth for the organizer and administrator. Roles must be assigned by a trusted administrator, never by public sign-up or editable profile fields.
- Store proposals and review state in an `events` table. Store role assignments separately from user-editable data. Every table needs Row Level Security (RLS): public reads approved events only; organizers read their own proposals and may submit/revise only their own nonapproved proposals; administrators read and review all proposals. No client may promote its own role or set approval state directly.
- Store event images in Supabase Storage. Pending images must not become publicly readable through a predictable storage URL; public images are readable only for approved events. Validate image type and size at upload.
- Database timestamps should preserve absolute instants; display and form entry use Asia/Manila. Require end time after start time.
- Do not copy the legacy MySQL student, credential, or password tables into this pilot. No student roster is needed to publish an event.

## Still to verify before feature code

- A real organizer's current approval steps, pain point, and workaround, for the required `PROBLEM.md` brief.
- The first organizer and administrator account identities (email addresses can be provided privately when setting up Auth; never send passwords or secret keys).
- Whether the public should see a separate council logo as well as an event poster. One required image is the current assumption.
