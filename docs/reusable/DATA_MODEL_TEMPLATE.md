# [Product name]: data model

## Authorities and trust boundaries

Name the identity source, role authority, persistence owner, public/read interfaces, privileged write interfaces, workers, and external services. Explain which inputs are untrusted and where each permission is enforced.

## Entities

For each entity record:

- Purpose, primary key, ownership, and lifecycle.
- Fields, types, nullability, limits, defaults, and units.
- Relationships, foreign-key behavior, uniqueness, and check constraints.
- Sensitive fields and the public projection.
- Queries, expected scale, ordering, and indexes justified by those queries.

## Access matrix

| Resource/action | Anonymous | Regular user | Owner/operator | Administrator/service |
| --- | --- | --- | --- | --- |
| [Resource/action] | [Deny/allow scope] | [Scope] | [Scope] | [Scope] |

Describe row/tenant restrictions and field-level restrictions separately. For SQL-backed public APIs, document both table/view grants and row policies. For other stores, document their equivalent authorization mechanism.

## Writes and concurrency

Specify atomic operations, transaction boundaries, state preconditions, duplicate handling, retries, and idempotency requirements. Record how two concurrent requests are resolved. Treat privileged functions, background credentials, and webhooks as API surfaces with explicit authorization.

## Files and integrations

Record size/type/path limits, upload authorization, read visibility, expiring links, retention/deletion, partial-failure cleanup, and external data ownership. No credentials belong here.

## Evolution and recovery

Link to migrations and seed strategy. Explain compatibility, backfills, backup/restore verification, and safe rollback or forward-fix. List authorization and integrity tests that must pass when changing the model.
