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

## Scope

Pilot covers `@granit/background-jobs`. Coverage grows one module at a time as
its snapshot is vendored and a conformance test is added. Endpoint (route/verb)
conformance is a planned follow-up.
