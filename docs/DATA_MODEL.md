# PHINMA UI Event: data and access

The eight numbered migrations in `supabase/sql/` are applied in order, including `008_admin_management.sql`. All eight are applied to hosted Supabase. Add new numbered migrations; do not rewrite applied SQL.

## Catalog and publisher identity

- `academic_programs`: `code` primary key, `name`, and `department`; unique `(code, department)`. The 16 programs are seeded from the sourced academic catalog.
- `organizations`: generated UUID `id`, trimmed `name` (1–120 characters), and an official college `department`. Unique `(name, department)` and `(id, department)`. Public reads expose publisher labels, not account membership or contact details. Only the existing CITE Council organization is seeded.
- `role_assignments`: one row per privileged Auth user. `role` is `organizer`, `event_admin`, or the compatibility spelling `cite_organizer`. Organizers require an `organization_id` foreign key; administrators require it to be null. Administrators can register organizer assignments through `admin_assign_organizer`; changing existing privileged assignments remains trusted administration. A nullable `course` references the academic catalog. New website registrations require one matching department/course; existing null-course grants retain department-wide access. Signed-in users can read their own assignment only.

Browser roles have SELECT only on the two public catalog tables and no mutation grants on assignments. All exposed tables have RLS enabled. No assignment means member access. User metadata never grants permissions. See `ORGANIZER_SETUP.md` for onboarding and revocation.

## Events

Events retain generated UUID, required Auth `created_by`, trimmed title (1–200), description (1–5,000), own-prefix `image_path`, required `timestamptz` start/end (end strictly later), course, department, target year (null for all, otherwise 1–4), and creation timestamp.

Raw character limits also reject oversized trailing whitespace. Event times must be finite and within years 0001–9999. Browser INSERT privileges cover only submission fields; IDs, creation timestamps, and review fields are database-owned.

`organization_id` is required. A security-invoker trigger in the private schema derives it from the caller's own trusted assignment and rejects a conflicting supplied ID. Foreign keys enforce both `(course, department)` against the academic catalog and `(organization_id, department)` against the organization. An organizer therefore cannot submit for another department or invent a program. The course remains one program per event.

Review status is `pending`, `approved`, or `rejected`. Pending requires null reviewer/time/reason. Approved requires reviewer/time and no rejection reason. Rejected requires reviewer/time and a trimmed reason of 1–1,000 characters. Schedule categories are derived, not stored. Schedule, pending, owner-history, organization, and academic foreign-key indexes support reads and integrity checks.

## Permissions and review

| Operation | Visitor/member | Organizer | Administrator |
| --- | --- | --- | --- |
| Read approved event | Yes | Yes | Yes |
| Read pending/rejected event | No | Own only | All |
| Insert event | No | Own pending, assigned organization/department/course | `admin_save_event`, pending |
| Direct content update | No | Own rejected events in current assigned organization only | No |
| Resubmit RPC | No | Own rejected events in current assigned organization only | No |
| Direct review/identity update or delete | No | No | No |
| Admin content-save/delete RPCs | No | No | All events; creator, publisher and review state preserved on edits |
| Approve/reject RPC | No | No | Pending events only |
| Register organizer/create publisher | No | No | Server-only Auth creation and trusted registration RPC |

`has_role(text)` checks the current database assignment. Its organizer spellings are compatible so existing CITE accounts and managed Storage policies continue working. `approve_event(uuid)` and `reject_event(uuid,text)` verify `event_admin`, atomically transition only a pending row, and record the reviewer. Concurrent/repeated decisions fail. These deliberate security-definer functions have an empty search path and signed-in EXECUTE grants; `PUBLIC` and `anon` EXECUTE are explicitly revoked by migration 004.

Migration 007 grants authenticated UPDATE only on title, description, image path, start/end, course, and target year. Its UPDATE policy requires own creator, rejected status, current trusted organizer role, and matching current organization in both USING and WITH CHECK. Review state, review metadata, identity, department, and creation time remain unwritable. Pending/approved events cannot be directly edited. `resubmit_event(uuid,text,text,text,timestamptz,timestamptz,text,smallint)` deliberately uses security definer with an empty search path to perform the single organizer transition. It repeats trusted role/owner/current-organization/rejected checks in its conditional UPDATE, atomically saves validated content and returns the event to pending with null review metadata. It accepts no caller-supplied status, reviewer, owner, organization, department, or creation timestamp. Anonymous/PUBLIC execution is revoked. Existing table constraints validate both direct edits and RPC input.

Direct SELECT grants expose only announcement columns, including under authenticated sessions. Account/review metadata cannot be selected directly. Public directory/detail queries use `PUBLIC_EVENT_SELECT` and explicitly filter `status = approved`, including for signed-in administrators; detail also filters UUID. Workspace queries call `workspace_events()` with `EVENT_SELECT`. This authenticated-only security-definer RPC checks the current assignment and returns full rows only for the organizer's own submissions or the administrator. Members receive no rows and anonymous execution is revoked. All readers join the organization's public label; filters use actual organization UUIDs.

## Images

`event-images` stays private, accepts JPG/PNG/WebP up to 5 MB, and restricts uploads to the organizer's own UUID path. Owners/admins can read review images; public image reads require a linked approved event. The platform-owned Storage policy definitions retain their original names and call the compatible role helper. They preserve owner/privacy rules for generic organizers.

Signed URLs expire after an hour; public/admin views and organizer history refresh them. Local pre-submit previews use object URLs and release them on replacement/reset/cancel/unmount. Insert/resubmission failure attempts removal of the unreferenced new image; migration 002 permits that cleanup. Successful poster replacement attempts removal of the old image after the save; the same policy protects any still-referenced image. A cleanup failure is reported explicitly and can leave a private orphan. No Storage UPDATE/upsert permission is added. Poster zoom uses the signed original image, with fit/actual-size display and scrolling, including during administrator review. Public poster paths contain the uploader's pseudonymous UUID; they are not anonymized. An issued signed URL remains usable until expiry even if a role is revoked.

## Verification

`supabase/tests/organization_access.sql` tests scoped council/staff submission, forged scope rejection, private reads, member/anonymous denial, admin publication/rejection, repeated decisions, and revocation inside a rolled-back transaction. It creates no persistent users/events. Browser fixtures test UI separately and do not prove password login or actual Storage transfer. See `VERIFICATION.md` for the latest boundaries and security advisory notes.

`supabase/tests/security_boundaries.sql` additionally covers invalid dates/text, protected timestamps/columns, workspace scope, and Storage metadata ownership/privacy/publication. Direct SQL Storage deletion is blocked by the platform and is not used as a substitute for Storage API transfer tests. See `AUDIT.md` for unresolved hosted Auth settings and broader audit evidence.

`supabase/tests/rejected_event_resubmission.sql` covers rejected-only edits, same-organization cross-owner denial, revoked/changed assignment denial, review/identity column protection, input constraints, repeated requests, atomic pending/reset behavior, private resubmissions, and fresh administrator approval. All fixtures roll back.

The UI cleans a failed save’s new poster only for a definite database rejection (4xx plus a validation/privilege/PLpgSQL SQLSTATE). Unknown errors, gateway failures, and thrown requests retain it: the database request can still commit after the client loses its response. Preserving that image avoids a pending event pointing to a deleted poster; an unresolved request may leave a private orphan.

## Administrator management — 27 October 2026

Migration 008 adds the assigned course and database-owned `events.updated_at`. The insert/update trigger checks a restricted organizer’s course on direct writes and resubmission RPCs; existing null-course assignments retain their previous scope. Browser grants do not allow writing the assignment or version. Public SELECT grants and `PUBLIC_EVENT_SELECT` exclude the version; the role-checked workspace RPC returns it for concurrency checks.

`admin_assign_organizer(email,publisher,department,course)` checks the current database administrator, validates the academic pair, locks the target Auth row, creates/reuses the publisher and grants only organizer access atomically. An exact repeat succeeds; different existing privileged access cannot be overwritten. `admin_organizers()` is administrator-only and exposes the private email/scope list. Anonymous/PUBLIC execution is revoked for all new RPCs.

The `admin-register-organizer` hosted Edge Function validates the user JWT using Auth `getUser`, then checks the current administrator grant before any Auth Admin operation. Its service role key exists only in the hosted function’s automatic environment. No privileged key is added to Next.js or Vercel. The platform JWT toggle is off because the handler performs its own user verification (compatible with current signing keys); missing/invalid sessions fail closed. New accounts receive an administrator-set 12–128 character initial password and administrator-confirmed email. This operation sends no email. Existing member accounts retain their existing password. A definite assignment rejection cleans up only a newly created account; unknown outcomes retain it so a possibly completed assignment is not deleted. Repeating registration can finish setup. Cleanup failure is reported explicitly.

`admin_save_event` creates pending events as the current administrator for a selected publisher, or edits an existing event without changing creator, organization/department, creation time, status or review metadata. `admin_delete_event` deletes any review status only after checking the current administrator. Both edit/delete require the exact database version and fail after a concurrent review, revision or edit. There are no new direct administrator UPDATE/DELETE policies or table grants. New private-bucket Storage policies allow administrator poster uploads and deletion only when no event references that path. An edit retains the original creator’s poster prefix; definite rejected saves clean the new unreferenced upload, unknown outcomes retain it, and old posters are removed only after a confirmed save. Event deletion returns its poster path for subsequent Storage API cleanup.

Hosted `supabase/tests/admin_management.sql` verifies administrator-only RPCs, course restrictions on all organizer write paths, registration retries and protected existing roles, pending creation, published edits, preserved identity/review, stale versions, deletion and revocation in a rolled-back transaction. The three previous hosted regression suites also pass. Browser fixtures and Auth Admin unit mocks cover UI and failure compensation; they do not prove a real new account’s password sign-in or real Storage transfer.
