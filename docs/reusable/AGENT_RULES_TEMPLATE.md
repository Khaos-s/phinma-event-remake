# [Product name]: agent rules template

Copy this file to the new repository's `AGENTS.md`, replace every bracketed field, and preserve framework-generated guidance already in that repository. This template is reference material until adopted there.

## Read first

- `docs/CONTEXT.md`: product, audience, scope, stack, and runtime.
- `docs/DATA_MODEL.md`: when changing identity, data, policies, migrations, or APIs.
- `docs/METHODOLOGY.md`: when changing states, calculations, approvals, or derived values.
- Relevant installed framework documentation before using an unfamiliar or changed API.

## Hard rules

- Implement the accepted task and spec; place later ideas in a backlog.
- Keep [chosen stack] and existing components unless a change is authorized.
- Enforce ownership and roles at trusted boundaries. Hiding UI never grants or denies API access.
- Validate external input and report failures without claiming success or discarding user data.
- Keep credentials and privileged keys out of source and browser bundles.
- Use reviewable migrations; protect existing data and concurrent writes.
- Record units, timezones, formulas, state transitions, and sources explicitly.
- Use honest loading, empty, error, and success states; label synthetic data.
- Verify the changed behavior and access-denied cases; report what was not tested.
- Follow [repository delivery policy] and verify the actual deployed revision.

For tools that support it, `CLAUDE.md` can contain `@AGENTS.md`. Confirm the instruction-file convention of other agents instead of assuming they load it.
