# @granit/contract-tests

Contract conformance oracle. Verifies that the hand-written `@granit/*` DTOs
still mirror the backend contract, using the per-module OpenAPI snapshots in
[`contracts/openapi/`](../../../contracts/openapi) as the source of truth.

## Why an oracle, not codegen

The backend (`Granit.OpenApi.Generator`) emits one OpenAPI document per module.
Generating TypeScript from it would **degrade** the curated public API — the
spec materializes generics (`PagedResultOfX`), widens every integer to
`number | string`, drops branded types (`ISODateString` → `string`), and names
operations off-convention (`getAll*` vs `list*`).

So instead of replacing the curated types, this package **diffs** them against
the spec at the level that matters — field presence, nullability, and coarse
type family — while a small **normalization table** absorbs the spec's
representation warts. Drift (a new backend field, a flipped nullability, a
removed field) fails the test; representation differences do not.

Two oracles:

- **`checkSchemaConformance`** — DTOs (field presence, nullability, type family).
- **`checkEndpointConformance`** — routes/verbs: every spec `path`+`method` has a
  front `client.METHOD()` call at the same route (the module `basePath` is
  auto-detected). Catches a removed route, a flipped verb, or a stale front call.

## Usage

```ts
import { checkSchemaConformance } from '@granit/contract-tests';

const violations = checkSchemaConformance({
  spec, // parsed contracts/openapi/<module>.json
  schemaName: 'BackgroundJobStatus',
  sourceText, // raw text of the front DTO file
  fileName, // its path
});
expect(violations).toEqual([]);
```

## Refreshing the snapshots

```bash
node scripts/sync-openapi-contracts.mjs            # all modules
node scripts/sync-openapi-contracts.mjs background-jobs
```

Reads the build artifacts of `Granit.OpenApi.Generator` (override the source
with `GRANIT_DOTNET=/path/to/granit-dotnet`).

## Extending coverage

1. Vendor the spec: `node scripts/sync-openapi-contracts.mjs <slug>`.
2. Add a line to [`src/manifest.ts`](src/manifest.ts):
   - `types` — per-module DTO interfaces (spec schema name === front interface
     name). Shared schemas (query-engine metadata, `ProblemDetails`, `*Of*`
     wrapper generics) belong to their owning package and are not listed.
   - `checkEndpoints: true` — also verify routes/verbs. Leave off for modules
     served by native `fetch` (BFF) instead of the Axios client.
   - `endpointIgnore` — routes (relative to the detected `basePath`) served by
     the query-engine generic surface (`''` list, `'/meta'`), not an `api/` fn.

The suite resolves each interface, brands (`EntityId<…>`, `ISODateString`),
local string-union aliases, `$ref` enums, and both `interface X {}` and
`type X = {…}` DTOs automatically.

Covered so far: `background-jobs`, `bff`, `blob-storage`, `api-keys`, `ai`,
`auditing`, `authorization`, `features` (endpoint conformance on the
Axios-client ones). Modules whose front DTO names still diverge from the spec
(e.g. `multi-tenancy` `AdminTenant` vs `TenantResponse`, several `webhooks`
types) need the same rename treatment as auditing/authorization before wiring.
The `Granit.OpenApi.Generator` ships the 30 framework modules; granit-business
modules (dashboards, parties, …) need an equivalent generator.
