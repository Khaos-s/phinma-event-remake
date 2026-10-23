# [Product name]: workflows and calculations

## Workflow

Describe the accepted user journey, including failure, cancellation, review, retry, and recovery paths. Do not turn a reference application's journey into a requirement without confirmation.

| Current state | Action | Authorized actor | Preconditions | Next state / effects |
| --- | --- | --- | --- | --- |
| [State] | [Action] | [Actor] | [Checks] | [Result] |

For each transition state what is atomic, what happens on a repeat request, and how concurrent decisions are resolved.

## Derived values

For each calculation name its inputs, source, formula, units, rounding, boundary behavior, null/missing handling, and timezone. Explain whether it is computed live, cached, or materialized and why. Include at least one normal example and one edge case.

## Freshness and asynchronous work

Define refresh intervals, source timestamps, delayed/unknown states, notification delivery guarantees, retry/backoff, and visibility after writes. Distinguish accepted work from completed work; never claim an email was delivered because a job was queued.

## Validation and feedback

List input limits, server/database enforcement, actionable field errors, busy/disabled behavior, partial-failure cleanup, and how users recover without data loss.

## Verification

Map each important behavior to a test or manual check: unauthorized actor, another owner's data, boundary time, duplicate/concurrent action, unavailable service, and recovery. Label synthetic fixtures and distinguish them from real production verification.
