# PHINMA UI Event: workflows and derived values

## Submission and review

1. An authorized organizer signs in through the shared login. Their organization and department come from a trusted assignment.
2. In My events they choose **Create event**, then enter a name, description, poster, start/end, course, and target year. The course must belong to their assigned department. The form validates all required details and poster before **Next: preview event** opens a private full event-details screen. **Back to details** preserves all fields and the selected poster; only the final Submit/Resubmit action uploads or writes. The selected poster updates locally and does not upload until submission; replacing/canceling it releases the temporary object URL. Saved submissions also offer a private card/details preview. Public presentation excludes review notes and unpublished sharing/calendar actions.
3. After final confirmation on the full preview screen, the poster uploads to an own private path. Inserting the event creates a pending submission. The final action repeats validation and guards against duplicate clicks.
4. The administrator's queue checks for submissions every 30 seconds while open and can be refreshed manually.
5. Approval changes pending to approved in one database operation. The event is then eligible for public reads, including its image.
6. Rejection changes pending to rejected and requires a reason visible to the organizer. The original organizer can use **Edit and resubmit** while still assigned to the event’s organization. The form loads the saved content and Philippine local times, shows the review note, and keeps the saved poster unless a replacement is selected. Cancel releases the local preview and leaves the stored event unchanged.
7. **Resubmit for review** sends the content to `resubmit_event`. It atomically updates only the caller’s own rejected event in their current organization, sets pending, and clears the old rejection reason/reviewer/time. It preserves the event ID, publisher, creator, and creation timestamp. A second request or a stale request against a pending/approved event fails. The event remains private until a new administrator approval.

The organizer can refresh submissions manually; the page also reloads status, notes, and signed posters every 60 seconds. A definite database rejection of an insert/resubmission attempts removal of its newly uploaded poster. A successful revision with a replacement attempts removal of the previous poster only after the database save. Storage denies deletion of a poster still linked to an event. Cleanup failure is reported without undoing a successful resubmission. Unknown/transport failures retain the uploaded poster because a request may still commit; the organizer must refresh before retrying. This may leave a private orphan if the request never completes. Administrator review supports full-size poster fit/zoom.

The workspace opens with the submissions list and All/Pending/Published/Rejected filters. A successful save closes the editor, selects Pending, and retains the review confirmation. Cancel returns to the list without saving. The details/preview steps stay in the same role-checked workspace and never put draft content in URLs or browser storage. While editing, Refresh submissions reveals and focuses the refreshed history without discarding fields, File, or object URL; this lets the organizer inspect a possibly committed pending event after an unconfirmed save. Refresh failures remain visible in the editor. Pending/published rows remain read-only and only published rows link to public event details. Preview dialogs support card/detail switching, nested poster zoom, Escape, focus containment/return and restored body scrolling.

Only the administrator can approve or reject. The organizer’s trusted resubmission RPC can only request a fresh pending review. There is one approval stage. The dashboard status label “Published” maps to the stored `approved` value; it is not a separate workflow state. Pending and published cards explicitly explain their locked state.

## Time and audience

Inputs are Philippine local time. `philippineTimeToIso` validates the calendar date, interprets it as UTC+08:00, and sends ISO timestamps. PostgreSQL stores `timestamptz`; display uses `Asia/Manila` regardless of the visitor's device timezone. End must be strictly later than start.

Database checks reject infinite/out-of-range schedules and unbounded raw text, including requests that bypass the form. Supported timestamps are years 0001–9999; malformed values render an invalid-schedule label rather than crashing the queue.

| Public category | Calculation |
| --- | --- |
| Upcoming | `now < starts_at` |
| Ongoing | `starts_at <= now < ends_at` |
| Past | `ends_at <= now` |

Boundary behavior is tested. The public page refreshes the schedule and current clock every minute; these filters are browsing aids, not access controls. Approval status is checked independently. A page can lag a newly approved event by up to its refresh interval; opening or refreshing it loads current data.

Null `target_year` means every college year. Selecting a year includes both that year and all-year events. Search matches title, description, course, or department without case sensitivity; leading/trailing spaces are ignored. Department, course, and organizer filters combine with time and year. All filters default to all records; changing department resets course. Academic options are sourced from the university's directory, independently of whether any events exist for a program. A filter with no published matches shows an honest empty state.

The organizer filter loads trusted organization records and compares `organization_id`, so council and faculty/staff publishers in the same department remain distinct. Event reads join the organization's public display label. The database validates the caller's current organization assignment and department/course pair on every submission. Public academic filters do not grant publishing access.

Both `/` and `/events` use the same event browser. A public card opens a native modal dialog with contained focus, Escape/backdrop/close controls, restored focus, and a full-details link. `/events/[id]` independently fetches a record using both its UUID and `status = approved`, even for a signed-in administrator. Invalid IDs skip the query; missing or unpublished records are unavailable. No review controls or rejection notes appear in public details.

Phone filters begin collapsed and expose labeled controls through a Show/Hide filters button; toggling preserves selections. Desktop filters remain visible. The full-details poster opens a separate native dialog with Fit image/Zoom in controls and a scrollable original-resolution image. Both dialogs preserve focus behavior and restore body scrolling on close.

## Counts and feedback

Published, pending, and rejected totals are derived from records available to the signed-in role. An organizer's totals include only their own submissions. No totals are invented or persisted as independent columns. A failed fetch shows an error or unavailable value, rather than claiming there are no events.

Submission success is displayed only after the event insert succeeds. Approval/rejection success is displayed only after the RPC succeeds. Busy controls prevent repeat clicks; the database pending-row condition still handles concurrent reviewers.

## Sessions

`AuthProvider` verifies the current user, reads the own role assignment, and responds to auth state changes. Deferred calls avoid doing another auth operation while the auth callback holds its lock. Revision checks discard outdated identity results. An identity change remounts page state so a previous account's loaded data is not retained in the next account's UI. Sign-out returns to the shared login.

Password recovery requests an email using `resetPasswordForEmail`, verifies the exact six-digit email code using `verifyOtp` with type `recovery`, and only then opens the new-password form. `PASSWORD_RECOVERY` routes to `/reset-password`; a fresh password sign-in or successful password update clears recovery navigation state. Supabase enforces the code/session/password boundaries. No new account is created. Email templates and OTP length are hosted settings; see `PASSWORD_RECOVERY.md` for required setup and delivery verification.

## Verification boundaries

Node tests cover role fallback/destinations, calendar boundary times, invalid dates, and combined audience/search filters. Local browser fixtures can check redirects, navigation, forms, role-specific layout, and sign-out without real credentials. Such fixtures do not prove live RLS, password authentication, email delivery, uploads, or publication. Verify database policies independently and label fixture results clearly. A real organizer submission followed by a real administrator decision remains the final owner-operated workflow check.

The administrator's unified Manage events view is an accessible table on desktop and stacked rows on phones. Inspect submission expands the actual full announcement and poster; its preview hides public sharing/calendar actions. Pending rows alone offer approve/reject controls. Reviewed decisions remain locked.

College code chips and select labels map back to full department names; changing a chip resets the course filter. Submitted scope still comes from trusted assignments. The public showcase applies the same approved-only selection and public schedule helpers; its protected form/table fragments never query workspace data.

## Administrator account and event management

The owner approved this extension on 27 October 2026. Manage organizers registers an email with an initial password, authorized publisher name, official department and one course in that department. The server creates the Auth account and the database grants scoped organizer access; existing member accounts keep their password. The administrator shares new initial credentials securely. The page never grants administrator access or replaces a different privileged assignment. Organizers continue to create pending events and revise only their own rejected submissions, now restricted to their assigned course where present.

Manage events also offers Create event, Edit event, full preview and Delete event. New administrator events start pending and use the existing Approve and publish action. Preview and Back do not upload or save. Edits keep the original owner/publisher and current review status; saving an approved event updates its public content immediately. Editing/deleting uses the version loaded by the editor/queue; a newer review or revision requires refreshing before retrying. Delete requires explicit browser confirmation and removes the event before attempting unused-poster cleanup. Failed cleanup does not undo a successful save/deletion and is shown separately. Keyboard focus returns to the event list after cancellation, saving or deletion. Administrator creation does not make another organizer the event’s creator.
