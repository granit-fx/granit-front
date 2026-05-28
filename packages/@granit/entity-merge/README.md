# @granit/entity-merge

Aggregate-agnostic **entity merge** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.EntityMerge` module
(`granit-dotnet/src/Granit.EntityMerge`, ex-`Granit.Mergeable`,
[rename PR](https://github.com/granit-fx/granit-dotnet/pull/2422)).

It exposes the types, HTTP client and pure helpers needed to drive a
two-aggregate merge from any client — React, React Native, a CLI, tests. It
holds **no** React, DOM or Node-only dependency. The React layer lives in
[`@granit/react-entity-merge`](../react-entity-merge).

A merge folds a **loser** aggregate into a **survivor**: scalar conflicts are
resolved per-field (override-at-merge-time, Salesforce/HubSpot-style),
cross-module foreign keys are rewritten in one transaction, and the loser is
soft-archived (tombstoned). The flow is preview (dry-run) → resolve conflicts
→ commit.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
`@granit/api-client` as a peer.

## Quick start

```ts
import { previewMerge, executeMerge, generateMergeIdempotencyKey } from '@granit/entity-merge';

// `basePath` is the mergeable aggregate's collection root — it encodes the
// aggregate, so the same calls work for parties, products, leads, …
const basePath = '/api/v1/parties';

// 1. Dry-run preview — conflicts + cross-module rewrite counts, no DB changes.
const preview = await previewMerge(client, basePath, survivorId, loserId);

// 2. Commit. Missing `choices` keys defer to each conflict's `default`.
const result = await executeMerge(
  client,
  basePath,
  survivorId,
  { loserId, choices: { Name: 'Loser' }, reason: 'Duplicate cleanup' },
  generateMergeIdempotencyKey() // sent as the `Idempotency-Key` header
);
```

## Public API

| Symbol                        | Kind | Purpose                                                     |
| ----------------------------- | ---- | ----------------------------------------------------------- |
| `WinnerSide`                  | type | `'Survivor' \| 'Loser'`                                     |
| `FieldConflict`               | type | One scalar conflict (values pre-stringified)                |
| `MergeFieldChoices`           | type | `Record<fieldPath, WinnerSide>` overrides                   |
| `MergeRequest<TId>`           | type | `POST .../merge` body                                       |
| `MergeResult<TId>`            | type | Preview & commit response (no aggregate payload)            |
| `previewMerge`                | fn   | `GET {basePath}/{survivorId}/merge/preview?loserId=`        |
| `executeMerge`                | fn   | `POST {basePath}/{survivorId}/merge` (+ idempotency header) |
| `generateMergeIdempotencyKey` | fn   | Fresh UUID for retry-safe submits                           |
| `seedFieldChoices`            | fn   | Seed choices with recommended defaults                      |
| `resolveWinner`               | fn   | Effective winner for a conflict                             |
| `classifyMergeError`          | fn   | 409/422/404/400 → stable kind + detail (no i18n)            |

The merged aggregate is intentionally absent from `MergeResult` — fetch the
survivor via its own detail endpoint after a successful live merge.

## Out of scope

- **Duplicate detection** (suggesting candidate pairs) — a separate backend
  feature ([granit-dotnet#1280](https://github.com/granit-fx/granit-dotnet/issues/1280),
  pg_trgm + fuzzy scoring). A future `@granit/duplicate-detection` will wrap it.
- **Multi-record merge (3+)** — backend is limited to two aggregates.
- **Un-merge** — backend roadmap P3.
- **External propagation** (Stripe/Mollie/Odoo) — not implemented backend-side.
