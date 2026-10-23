# Spec: PHINMA UI Event

## Problem

An authorized council, faculty, or department staff organizer needs a simple way to send an event to the PHINMA Event administrator and have it appear publicly as soon as that administrator approves it. The present real-world process has not been observed, so a live user test must still check this workflow with its intended users.

## Solution

The organizer signs in and submits an event form. The administrator sees the pending submission in a review queue, approves or rejects it, and approval immediately makes the event visible to anyone on the public events page.

## The user

The primary user is an authorized event organizer assigned to a trusted organization and department. An administrator performs the single required approval; public visitors see the result without signing in.

## User stories

1. As an organizer, I want to sign in so only authorized people can submit events for their assigned organization and department.
2. As an organizer, I want to submit the event image, name, description, start and end times, department, course, and target year so the administrator can review a complete announcement.
3. As an organizer, I want to see whether my submission is pending, approved, or rejected so I know its outcome.
4. As an administrator, I want to see pending submissions and their details so I can decide whether to publish them.
5. As an administrator, I want one approval action to publish an event automatically.
6. As an administrator, I want to reject a submission with a reason so the organizer understands the decision.
7. As a visitor, I want to view approved events and filter them by Upcoming, Ongoing, or Past without signing in.
8. As a visitor, I want department, course, organizer, and year filters, starting with all options selected.
9. As a visitor, I want to click an event for a quick-view popup, then open its full details at a shareable event URL.

## Screens

- Public home `/`: university introduction and the shared event browser. No council-specific promotional block or approval workflow explanation.
- All events `/events`: approved event directory with search and time, department, course, organizer, and year filters.
- Quick view: clicking a public event card opens a modal with poster, title, schedule, audience, description, and a link to full details. Support close, Escape, focus containment/return, and phone scrolling.
- Full details `/events/[id]`: directly open an approved event's complete announcement. Missing, invalid, or unpublished IDs show an unavailable state; failed requests show an error.
- Shared sign-in page: email and password for all registered accounts.
- Member account page: verified account identity, current access, and event browsing.
- Organizer page: event submission form and own submissions with review status and rejection reason.
- Administrator page: pending count, full submission details, and Approve/Reject actions.
- Organizer submission status and signed posters refresh manually and every minute; administrators can expand posters during review. Public announcement fields and private workspace metadata use separate database access boundaries.

All authenticated pages share a role-aware sidebar workspace and a compact mobile navigation. Public filters use the official college-programs listing documented in `ACADEMIC_REFERENCE.md`. Department changes reset the course filter; CITE Council appears as an organizer option, not a default scope label. The shared login uses the same PHINMA identity. The supplied design board is a visual reference only; scholarship/duty records and water-reporting rules are not included. See `docs/DESIGN.md` for the mapping.

## Data

- `academic_programs` and `organizations`: trusted public labels and valid program/department pairs. A publishing organization can represent a council, faculty, or staff; no publisher names are invented beyond the existing CITE Council record.
- `role_assignments`: Supabase Auth user ID, role (`organizer` or `event_admin`, with legacy `cite_organizer` compatibility), and the organization ID required for organizers. A signed-in user may read their own grant; no browser user may create or change grants. Trusted administrative setup assigns roles and publishing identity.
- `events`: ID, organizer ID, title, description, private image path, start and end timestamps, department, course, target year (empty means all college years), review status, rejection reason, reviewer ID, review time, and creation time. Anyone may read approved events. An organizer may read their own submissions and create a pending event; they cannot approve or edit a published event. An administrator may read all submissions and approve or reject pending ones.
- Private Supabase Storage bucket for event images: the organizer may upload their own image. The image is readable by its organizer and the administrator during review, and by everyone only after its event is approved.

The department comes from the organizer assignment; course must be a valid program within that department. Foreign keys and database access rules validate this on every insert. Each account currently has one organization assignment, and each event targets one course. Target year is All college years or 1st–4th Year. Times are entered and shown in Asia/Manila. End must be after start. Upcoming means start is later than now, Ongoing means start is at or before now and end is after now, and Past means end is at or before now. Only approved events appear in public filters.

## Login

One shared Supabase Auth email and password form for all registered accounts. An administrator goes to the review queue, a scoped organizer goes to event submission, and an account without a privileged role goes to its member account page. Role grants come only from `role_assignments`; absence of a grant means member access. User-editable metadata and form inputs never grant permissions. Public visitors can browse without signing in. The navigation reflects the current account and supports sign-out. No public role selection or self-assignment.

## Done for the demo

- An authorized organizer can submit one complete event for their assigned organization and department.
- The submission appears in the administrator's queue but not on the public page.
- One administrator approval immediately makes the event public.
- Rejection keeps an event private and shows the reason to its organizer.
- A signed-out visitor can filter approved events by Upcoming, Ongoing, and Past.
- A signed-out visitor and an organizer cannot approve events or see another organizer's pending submission.

## Out of scope

- Student roster and registration features from the legacy application.
- Multiple organization memberships per account, cross-department/multiple-course audiences, and a website role-assignment interface.
- Email notifications and a separate council logo asset.
- Editing or resubmitting an event after review; a rejected organizer may submit a new event.

## Organizer and mobile usability

The organizer sees a local poster preview before upload. Phone filters start collapsed, retain selections when closed, and expand through a labeled button. Full event posters open in an accessible dialog with fit/zoom controls and original-image scrolling. Trusted publisher setup is documented in `ORGANIZER_SETUP.md`.
