# Spec: PHINMA Event CITE pilot

## Problem

An authorized CITE Council organizer needs a simple way to send an event to the PHINMA Event administrator and have it appear publicly as soon as that administrator approves it. The present real-world process has not been observed, so the first live test must check this workflow with its intended users.

## Solution

The organizer signs in and submits an event form. The administrator sees the pending submission in a review queue, approves or rejects it, and approval immediately makes the event visible to anyone on the public events page.

## The user

The primary user is an authorized CITE Council event organizer. An administrator performs the single required approval; public visitors see the result without signing in.

## User stories

1. As an organizer, I want to sign in so only authorized people can submit CITE events.
2. As an organizer, I want to submit the event image, name, description, start and end times, department, course, and target year so the administrator can review a complete announcement.
3. As an organizer, I want to see whether my submission is pending, approved, or rejected so I know its outcome.
4. As an administrator, I want to see pending submissions and their details so I can decide whether to publish them.
5. As an administrator, I want one approval action to publish an event automatically.
6. As an administrator, I want to reject a submission with a reason so the organizer understands the decision.
7. As a visitor, I want to view approved events and filter them by Upcoming, Ongoing, or Past without signing in.

## Screens

- Public events page: approved event cards, event details, and Upcoming/Ongoing/Past filter.
- Sign-in page: email and password for the two test roles.
- Organizer page: event submission form and own submissions with review status and rejection reason.
- Administrator page: pending count, full submission details, and Approve/Reject actions.

## Data

- `role_assignments`: Supabase Auth user ID and role (`cite_organizer` or `event_admin`). A signed-in user may read their own role; no browser user may create or change roles. Role grants are set through a trusted administrative action.
- `events`: ID, organizer ID, title, description, private image path, start and end timestamps, department, course, target year (empty means all college years), review status, rejection reason, reviewer ID, review time, and creation time. Anyone may read approved events. An organizer may read their own submissions and create a pending event; they cannot approve or edit a published event. An administrator may read all submissions and approve or reject pending ones.
- Private Supabase Storage bucket for event images: the organizer may upload their own image. The image is readable by its organizer and the administrator during review, and by everyone only after its event is approved.

For the pilot, the department and course are College of Information Technology and BSIT. Target year is All college years or 1st–4th Year. Times are entered and shown in Asia/Manila. End must be after start. Upcoming means start is later than now, Ongoing means start is at or before now and end is after now, and Past means end is at or before now. Only approved events appear in public filters.

## Login

Supabase Auth email and password. Use one test CITE organizer and one test PHINMA Event administrator account. Public visitors do not sign in. No public role selection or self-assignment.

## Done for the demo

- A CITE organizer can submit one complete event on the live URL.
- The submission appears in the administrator's queue but not on the public page.
- One administrator approval immediately makes the event public.
- Rejection keeps an event private and shows the reason to its organizer.
- A signed-out visitor can filter approved events by Upcoming, Ongoing, and Past.
- A signed-out visitor and an organizer cannot approve events or see another organizer's pending submission.

## Out of scope

- Student roster and registration features from the legacy application.
- More councils, colleges, and courses.
- Email notifications and a separate council logo asset.
- Editing or resubmitting an event after review; a rejected organizer may submit a new event.
