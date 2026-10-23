# PHINMA UI Event: workflows and derived values

## Submission and review

1. A CITE organizer signs in through the shared login.
2. They enter a name, description, poster, start/end, and audience. Department/course are fixed for the pilot.
3. The poster uploads to an own private path. Inserting the event creates a pending submission.
4. The administrator's queue checks for submissions every 30 seconds while open and can be refreshed manually.
5. Approval changes pending to approved in one database operation. The event is then eligible for public reads, including its image.
6. Rejection changes pending to rejected and requires a reason visible to the organizer. A rejected organizer can submit a new event; editing and resubmission are not implemented.

Only the administrator can make the review transition. There is one approval stage. The dashboard status label “Published” maps to the stored `approved` value; it is not a separate workflow state.

## Time and audience

Inputs are Philippine local time. `philippineTimeToIso` validates the calendar date, interprets it as UTC+08:00, and sends ISO timestamps. PostgreSQL stores `timestamptz`; display uses `Asia/Manila` regardless of the visitor's device timezone. End must be strictly later than start.

| Public category | Calculation |
| --- | --- |
| Upcoming | `now < starts_at` |
| Ongoing | `starts_at <= now < ends_at` |
| Past | `ends_at <= now` |

Boundary behavior is tested. The public page refreshes the schedule and current clock every minute; these filters are browsing aids, not access controls. Approval status is checked independently. A page can lag a newly approved event by up to its refresh interval; opening or refreshing it loads current data.

Null `target_year` means every college year. Selecting a year includes both that year and all-year events. Search matches title, description, course, or department without case sensitivity; leading/trailing spaces are ignored. Department, course, and organizer filters combine with time and year. All filters default to all records; changing department resets course. Academic options are sourced from the university's directory, independently of whether any events exist for a program. A filter with no published matches shows an honest empty state.

The organizer filter recognizes the existing CITE/BSIT pilot submissions as CITE Council. It does not label another department's events as council events. This is a pilot mapping, not a generic organization model: store trusted organizer/organization identity before onboarding other publishers. Current creation constraints and role grants still limit website submissions to the CITE pilot.

Both `/` and `/events` use the same event browser. A public card opens a native modal dialog with contained focus, Escape/backdrop/close controls, restored focus, and a full-details link. `/events/[id]` independently fetches a record using both its UUID and `status = approved`, even for a signed-in administrator. Invalid IDs skip the query; missing or unpublished records are unavailable. No review controls or rejection notes appear in public details.

## Counts and feedback

Published, pending, and rejected totals are derived from records available to the signed-in role. An organizer's totals include only their own submissions. No totals are invented or persisted as independent columns. A failed fetch shows an error or unavailable value, rather than claiming there are no events.

Submission success is displayed only after the event insert succeeds. Approval/rejection success is displayed only after the RPC succeeds. Busy controls prevent repeat clicks; the database pending-row condition still handles concurrent reviewers.

## Sessions

`AuthProvider` verifies the current user, reads the own role assignment, and responds to auth state changes. Deferred calls avoid doing another auth operation while the auth callback holds its lock. Revision checks discard outdated identity results. An identity change remounts page state so a previous account's loaded data is not retained in the next account's UI. Sign-out returns to the shared login.

## Verification boundaries

Node tests cover role fallback/destinations, calendar boundary times, invalid dates, and combined audience/search filters. Local browser fixtures can check redirects, navigation, forms, role-specific layout, and sign-out without real credentials. Such fixtures do not prove live RLS, password authentication, email delivery, uploads, or publication. Verify database policies independently and label fixture results clearly. A real organizer submission followed by a real administrator decision remains the final owner-operated workflow check.
