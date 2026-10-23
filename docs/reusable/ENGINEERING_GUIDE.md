# Reusable engineering guide

This is a decision guide, not a dependency list or a claim that every project needs every capability. Start with the context, data model, and methodology templates in this folder. Replace their placeholders for the next system; do not copy this application's roles or event rules into it.

## Scope and architecture

Name the user, core job, evidence, trust boundaries, and deployable first result. Read existing code and framework documentation. Reuse a suitable module before adding a layer. A service layer is useful when several callers share business logic; do not introduce one only to wrap a single API call. Record significant tradeoffs and upgrade triggers.

For Next.js, keep server-rendered reads and credentials on the server; use Client Components for browser interaction. Server Actions, route handlers, workers, and database RPCs all need their own identity, ownership, and role checks. Server Components alone are not an authorization mechanism. In another framework, identify the equivalent boundaries.

## Data and database work

Model identities, ownership, relationships, constraints, and lifecycle first. Derive values when the calculation is cheap and authoritative; persist snapshots or aggregates when history, auditability, or measured workload requires them. Explain rounding and units. Use transactions and conditional updates for related writes and competing state transitions.

Choose indexes from actual filters, joins, sort order, and query plans. B-tree suits common equality/range/order queries; GIN or spatial indexes are justified by their query types. Avoid speculative indexing. Add pagination when volume needs it; cursor pagination needs a stable order and tie-breaker. Check N+1 queries and measure before adding caches.

Keep migrations versioned and reviewable. Add compatible schema first, deploy compatible code, backfill with a recovery path, then remove old structures in a later change. Rehearse backups/restores and destructive operations where their risk warrants it.

## Identity, authorization, and input

Use the chosen identity provider's supported session flow. Check current documentation rather than assuming cookie or token defaults. Protect every mutation and private read. Roles must come from a trusted authority; user-editable profile fields cannot be used as grants. Consider revocation freshness and tenant/owner boundaries.

For Supabase, distinguish API keys, SQL grants, RLS, and privileged functions: all are separate controls. Enable RLS on exposed tables, test another user's access, review views for bypass behavior, and restrict privileged RPC execution. Never put a secret/service-role key in browser code or a `NEXT_PUBLIC_` variable.

Validate untrusted fields at the trusted boundary with explicit types and limits. Reuse an installed schema library such as Zod when helpful; simple checks need no new dependency. Keep database constraints as a final integrity guard. Parameterize queries, preserve framework output escaping, and sanitize any intentional HTML rendering. For cookies and writes, evaluate CSRF/origin controls for the actual request flow. Add rate limits and abuse controls to exposed expensive or anonymous writes when justified by the threat model.

## Files, integrations, and background work

Restrict uploads by size, accepted type, owner path, and read policy. Plan for upload-success/write-failure and for cleanup failure. Keep private files private and use appropriately short signed links. Verify webhook signatures, reject replay where needed, and make retryable writes idempotent.

Use jobs, queues, cron, or transactional email only for a real asynchronous requirement. Record accepted/completed/failed states and delivery guarantees. Retry with bounded backoff, log correlation IDs, and prevent duplicate external effects. Never report a message as sent or delivered without evidence for that state.

## Rendering and performance

Prefer accessible native controls and existing UI components. Keep navigation, focus, labels, contrast, loading, empty, error, and success states usable at phone and desktop widths. Respect reduced motion. Give images meaningful alt text, appropriate dimensions/crops, and optimized delivery; keep font loading deliberate.

Cache only with explicit identity scope, freshness, and invalidation rules. Never reuse one user's private response for another. For Next.js, inspect the installed version's caching and revalidation behavior. Use streaming when it improves the real loading experience; do not add it to hide failed or unauthenticated work.

## Testing and delivery

Test business boundaries, state transitions, ownership, forbidden actions, and recovery paths. Use unit tests for calculations, integration tests for real persistence/API contracts, and browser tests for important user journeys. Pick tools already installed where possible. Synthetic fixtures must not be mistaken for live identity, RLS, uploads, or delivery checks.

Run the repository's lint, type checking, relevant tests, and production build. Review the diff for secrets, generated files, and accidental scope. Use preview deployments when changes need review. For Vercel/Git integration, verify the deployment matches the intended commit, its public domain works, and environment variables are configured for the correct environment. Prepare rollback or a forward-fix for material production risk.

Add logs, alerts, analytics, Web Vitals, MFA, dedicated caches, maps, charts, queues, or separate services when the workload or risk calls for them. An installed plugin or a reference skills list does not make those product features. State what was verified, what remains unverified, and what the user must do next.
