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
10. As an organizer, I want to revise my own rejected event using the administrator’s note and resubmit it for a fresh review, keeping or replacing its poster.
11. As a visitor, I want to discover live/featured approved events, download an event calendar file, share its details, and find related approved events.
12. As a visitor, I want a contact page with verified university contact channels and event-publication guidance.

## Screens

- Public home `/`: university introduction and the shared event browser. No council-specific promotional block or approval workflow explanation.
- All events `/events`: approved event directory with search and time, department, course, organizer, and year filters.
- Public contact `/contact`: verified university address/phone/email, university/Maps links, and administrator/sign-in guidance without a contact backend.
- Quick view: clicking a public event card opens a modal with poster, title, schedule, audience, description, and a link to full details. Support close, Escape, focus containment/return, and phone scrolling.
- Full details `/events/[id]`: directly open an approved event's complete announcement. Missing, invalid, or unpublished IDs show an unavailable state; failed requests show an error.
- Shared sign-in page: email and password for all registered accounts.
- Password recovery `/forgot-password`: request an email code, verify exactly six digits with Supabase recovery OTP, then set a new password at `/reset-password` using the verified Auth session. Hosted email-template/OTP configuration is required; see `PASSWORD_RECOVERY.md`.
- Member account page: verified account identity, current access, and event browsing.
- Organizer page: one My events destination with a Create event button, own submissions/status filters/rejection notes, and an on-demand creation/revision form. Live event-card and saved card/details previews reuse public presentation privately; previewing performs no upload or publication and offers no sharing of unpublished events.
- Administrator page: one Manage events list with Pending, Published, Rejected, and All filters, real counts, full submission details, and pending-only Approve/Reject actions. Browse events remains a public navigation link.
- Organizer submission status and signed posters refresh manually and every minute; administrators can expand posters during review. Public announcement fields and private workspace metadata use separate database access boundaries.

All authenticated pages share a role-aware sidebar workspace and a compact mobile navigation. Public filters use the official college-programs listing documented in `ACADEMIC_REFERENCE.md`. Department changes reset the course filter; CITE Council appears as an organizer option, not a default scope label. The shared login uses the same PHINMA identity. The supplied design board is a visual reference only; scholarship/duty records and water-reporting rules are not included. See `docs/DESIGN.md` for the mapping.

Public and workspace pages support system/light/dark appearance with a persisted toggle. User-triggered authentication, submission, and review feedback uses dismissible toast notifications alongside durable inline messages. Busy controls and loading states animate only when reduced motion is not requested.

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
- Editing pending or already published events. Rejected events may be revised and resubmitted by their original organizer within their current assigned organization.

## Organizer and mobile usability

The organizer sees a local poster preview before upload. Phone filters start collapsed, retain selections when closed, and expand through a labeled button. Full event posters open in an accessible dialog with fit/zoom controls and original-image scrolling. Trusted publisher setup is documented in `ORGANIZER_SETUP.md`.

## Visual showcase and recovery template handoff

A public `/showcase` view arranges the eight core screens/components in a responsive bento grid using canonical PHINMA tokens and typography. Public event panels read approved announcements only. Protected workspace previews show disabled layout controls and links to role-checked pages, without exposing submissions. No demonstration records, accounts, or counts are inserted. The normal public catalog supports the eight college code labels, sixteen program codes, existing year levels, and derived time filters.

An `/email-template` page previews the branded reset email and copies/downloads the exact HTML with Supabase's token placeholder. The project owner must save it in hosted Supabase and confirm six-digit OTP settings/email-provider eligibility before outgoing messages change. This handoff sends no email and changes no hosted settings.

## Two-step organizer proposal

Creating or revising a rejected event uses Details → Preview & submit. Next validates the complete form and required poster and opens full announcement details with the original/selected poster, Philippine schedule, publisher and audience. Back preserves the draft and selected image. Only the final confirmation uploads and saves through the existing trusted operation; public sharing/calendar actions and administrator feedback are excluded from the appearance preview. Pending and approved events remain locked. If a save response is uncertain, Refresh reveals actual submission history while keeping the draft intact. No new role, table, field, policy, or publisher assignment is introduced.

## Accepted extension — 27 October 2026

- Administrators register organizer users by email, initial password, authorized publisher/organization, department, and one valid course. The selected course restricts that organizer’s submissions. Existing member accounts retain their password, and different existing privileged assignments cannot be overwritten.
- Administrators create pending events with a full preview, inspect all events, edit content in any status, and confirm deletion. Approving a pending event remains the publishing action. Edits to published events take effect immediately while preserving creator/publisher and review metadata.
- Organizers retain their current rules: own pending creation and own rejected-event revision/resubmission; pending and approved events stay locked.
- Database rules and server-only Auth APIs enforce access. Stale edits/deletions are rejected, sensitive account data remains admin-only, and failed/uncertain operations preserve useful recovery information.
- User-account deletion, reassignment of existing privileged roles, organizer editing/deleting approved events, and additional “etc.” capabilities are outside this extension.
