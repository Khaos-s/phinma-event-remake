# Set up an authorized organizer

Administrators can open **Manage organizers** (`/admin/users`), enter the account email and initial password, and select the authorized publisher, department and one course. New accounts use that initial password; share it securely with the owner. Existing member accounts keep their password. A different existing privileged assignment is rejected. Exact registration retries are safe. The selected course is enforced by the database; existing null-course grants keep department-wide access.

The website never permits self-assignment or grants new administrator roles. For initial administrator bootstrap, revocation or a deliberate existing-role change, use a trusted Supabase administration session:

1. Obtain the publisher's approved organization name, official department, and existing Supabase Auth user UUID. A publisher can represent a council, faculty group, or department staff; their display name need not contain “Council.” Do not invent names or change an account's role based on editable user metadata.
2. Create the organization, or reuse its existing ID:

```sql
insert into public.organizations (name, department)
values ('<approved organization name>', '<official department from academic_programs>')
returning id;
```

3. Assign the existing Auth account, replacing placeholders with verified UUIDs:

```sql
insert into public.role_assignments (user_id, role, organization_id, course)
values ('<Auth user UUID>', 'organizer', '<organization UUID>', '<matching academic program code>')
on conflict (user_id) do update
set role = excluded.role, organization_id = excluded.organization_id, course = excluded.course;
```

4. Refresh/sign in again and verify the displayed organization, read-only department, and course choices. Submit a proposal, then sign in as the PHINMA Event administrator to review it. Organizers cannot approve or publish their own submissions.

Each account currently has one assignment. Review any existing privileged grant before replacing it; assigning an administrator as an organizer removes that account's administrator role. Administrator grants use `role = 'event_admin'` with `organization_id = null`.

To revoke organizer access, delete the account's `role_assignments` row. Database checks enforce revocation on subsequent requests; old event ownership/history remains intact. Keep organization records that existing events reference. The existing `cite_organizer` grant remains supported as a compatibility spelling and is already linked to CITE Council.

Do not commit real account email addresses or UUID assignments to the repository. New organizations and grants require actual approved publisher details; adding academic filter options does not authorize accounts.
