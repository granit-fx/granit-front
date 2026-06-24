# @granit/entity-merge

Aggregate-agnostic **entity merge** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.EntityMerge` module
(`granit-dotnet/src/Granit.EntityMerge`, formerly `Granit.Mergeable`).

This is the framework-agnostic **core** layer: it exposes the types, HTTP client
and pure helpers needed to drive a two-aggregate merge from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency.
The React hooks/providers layer lives in
[`@granit/react-entity-merge`](../react-entity-merge); there is no `react-ui`
admin feature kit.

A merge folds a **loser** aggregate into a **survivor**: scalar conflicts are
resolved per-field (override-at-merge-time, Salesforce/HubSpot-style),
cross-module foreign keys are rewritten in one transaction, and the loser is
soft-archived (tombstoned). The flow is preview (dry-run) → resolve conflicts →
commit. The wire shape is identical across aggregates because the merged
aggregate itself is never returned in the body; domain packages
(`@granit/parties`, future `@granit/products`, …) re-export these contracts with
their own branded id types via the `TId` parameter.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.

## Quick start

```ts
import {
  previewMerge,
  executeMerge,
  generateMergeIdempotencyKey,
  seedFieldChoices,
  resolveWinner,
  classifyMergeError,
} from '@granit/entity-merge';

// `basePath` is the mergeable aggregate's collection root — it encodes the
// aggregate, so the same calls work for parties, products, leads, …
const basePath = '/api/v1/parties';

// 1. Dry-run preview — conflicts + cross-module rewrite counts, no DB changes.
const preview = await previewMerge(client, basePath, survivorId, loserId);

// 2. Seed admin choices with the recommended defaults, then override per field.
let choices = seedFieldChoices(preview.conflicts, {});
const nameWinner = resolveWinner(preview.conflicts[0]!, choices); // 'Survivor' | 'Loser'

// 3. Commit. Missing `choices` keys defer to each conflict's `default`.
try {
  const result = await executeMerge(
    client,
    basePath,
    survivorId,
    { loserId, choices, reason: 'Duplicate cleanup' },
    generateMergeIdempotencyKey() // sent as the `Idempotency-Key` header
  );
  // result.rewriteCounts: { 'Invoice.PartyId': 12, ... } — the merged
  // aggregate itself is absent; fetch the survivor via its detail endpoint.
} catch (error) {
  const { kind } = classifyMergeError(error); // 'conflict' | 'domain' | ...
}
```

## Public API

| Symbol                        | Kind | Purpose                                                     |
| ----------------------------- | ---- | ----------------------------------------------------------- |
| `WinnerSide`                  | type | `'Survivor' \| 'Loser'`                                     |
| `FieldConflict`               | type | One scalar conflict (values pre-stringified server-side)    |
| `MergeFieldChoices`           | type | `Record<fieldPath, WinnerSide>` per-field overrides         |
| `MergeRequest<TId>`           | type | `POST .../merge` body (loser id, choices, reason, dryRun)   |
| `MergeResult<TId>`            | type | Preview & commit response (no aggregate payload)            |
| `MergeErrorKind`              | type | `conflict \| domain \| notFound \| validation \| unknown`   |
| `ClassifiedMergeError`        | type | `{ kind, detail, status }` from a failed merge              |
| `previewMerge`                | fn   | `GET {basePath}/{survivorId}/merge/preview?loserId=`        |
| `executeMerge`                | fn   | `POST {basePath}/{survivorId}/merge` (+ idempotency header) |
| `generateMergeIdempotencyKey` | fn   | Fresh RFC 4122 UUID for retry-safe submits                  |
| `seedFieldChoices`            | fn   | Seed choices with recommended defaults (no manual clobber)  |
| `resolveWinner`               | fn   | Effective winner for a conflict given current choices       |
| `classifyMergeError`          | fn   | 409/422/404/400 → stable kind + ProblemDetails (no i18n)    |

The merged aggregate is intentionally absent from `MergeResult` — fetch the
survivor via its own detail endpoint after a successful live merge.

## Caveats

- **GDPR minimisation on replay.** On an idempotency-cache replay the backend
  omits the conflict values (`survivorValue` / `loserValue` may be `null` even
  when `fieldPath` and `default` are set). Treat both value fields as nullable.
- **Idempotency-key reuse.** Reusing the same key with a *different* payload
  returns `409` (`classifyMergeError` → `conflict`); generate a fresh key per
  distinct submission with `generateMergeIdempotencyKey`.
- **i18n is the caller's job.** `classifyMergeError` returns a stable
  `MergeErrorKind` and the raw RFC 7807 `detail`/`title`; the React/UI layer
  owns the localized message mapping.

## Out of scope

- **Duplicate detection** (suggesting candidate pairs) — a separate backend
  feature (pg_trgm + fuzzy scoring). A future `@granit/duplicate-detection`
  will wrap it.
- **Multi-record merge (3+)** — backend is limited to two aggregates.
- **Un-merge** — backend roadmap P3.
- **External propagation** (Stripe/Mollie/Odoo) — not implemented backend-side.

## License

Apache-2.0
