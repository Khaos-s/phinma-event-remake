# Later

Good ideas that are not in the MVP.

Parking something here is a decision, not a loss. It is how the MVP
stays small enough to actually ship by Session 3.

- Multiple organization memberships per account, cross-department/multiple-course event audiences, and an in-website role-assignment interface. Scoped organization access for authorized councils, faculty, and staff is already supported through trusted setup.
- Student registration, student rosters, and year-level accounts from the old Flask/MySQL project.
- Editing already published events with a fresh review of proposed changes.
- Separate council logo and event poster assets if one event image is insufficient.
- Email notifications for new proposals and review outcomes; the first release uses the in-app review queue and status.
- Pagination/server filtering for large event histories and directories before exceeding hosted query limits; see `AUDIT.md` for current scale and operational boundaries.
- An event venue/location field would require an approved additive migration and validation before appearing in details, maps, or calendar files. The university contact address is not an event venue.
- Event registration/RSVP, a contact form backend, and user-selected featured events are not part of the public refresh. Calendar downloads and share links work without these features.

