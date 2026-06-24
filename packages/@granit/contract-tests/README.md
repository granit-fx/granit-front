# @granit/contract-tests

Contract conformance **oracle** — verifies that the hand-written `@granit/*` DTOs
and `api/` functions still mirror the backend contract, using the per-module
OpenAPI snapshots in [`contracts/openapi/`](../../../contracts/openapi) as the
source of truth. Tooling layer: a pure TypeScript-compiler analysis with no
runtime, React, DOM, or network dependency.

The front does **not** use Orval / codegen — generating TypeScript from the spec
would degrade the curated public API (it materializes generics like
`PagedResultOfX`, widens every integer to `number | string`, drops branded types
such as `ISODateString → string`, and names operations off-convention,
`getAll*` vs `list*`). So instead of replacing the curated types, this package
**diffs** them against the spec at the level that matters — field presence,
nullability, and coarse type family — while a small normalization table absorbs
the spec's representation warts. Real drift (a new backend field, a flipped
nullability, a removed route, a swapped verb) fails the test; representation
differences do not. It has no sibling-package split: the whole oracle lives here,
and `src/manifest.ts` enumerates which framework / business modules are wired in.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, no build
step. The oracle reads source text and walks `import`/`export … from` edges with
the bundled `typescript` compiler API; no peer dependencies to declare beyond a
`typescript` install (already present everywhere in the workspace).

## Quick start

The two exported oracles are pure functions over already-parsed inputs — the
test suite supplies the spec JSON, the DTO source text, and the `api/` sources.

```ts
import { checkSchemaConformance, checkEndpointConformance } from '@granit/contract-tests';

// 1. DTO conformance — field presence, nullability, coarse type family.
const violations = checkSchemaConformance({
  spec, // parsed contracts/openapi/<module>.json
  schemaName: 'BackgroundJobStatus', // schema in components.schemas
  sourceText, // raw text of the front DTO file
  fileName, // its path (used in messages + TS parsing)
  // typeName — front interface name; defaults to schemaName
});
expect(violations).toEqual([]);

// 2. Route/verb conformance — every spec path+method has a front
//    client.METHOD() call at the same route (basePath auto-detected).
const routeViolations = checkEndpointConformance(
  'background-jobs',
  spec, // same parsed document, read for its `paths`
  apiSources, // [{ file, text }] for every api/**/*.ts in the package
  { ignore: ['', '/meta'] } // routes served by the query-engine generic surface
);
expect(routeViolations).toEqual([]);
```

In practice you never call these by hand. `src/__tests__/conformance-suite.test.ts`
drives them from `src/manifest.ts`: it loads each vendored spec, locates the
declaring file for every listed interface, and asserts the violation array is
empty — `it.each` per type, plus one route check per `checkEndpoints: true`
entry.

## Public API

| Symbol                     | Kind | Purpose                                                          |
| -------------------------- | ---- | ---------------------------------------------------------------- |
| `checkSchemaConformance`   | fn   | Diff one front DTO against its backend schema (objects + unions) |
| `checkEndpointConformance` | fn   | Diff a module's `api/` `client.*()` calls against the spec paths |
| `CheckSchemaOptions`       | type | Input to `checkSchemaConformance` (spec, names, source, file)    |
| `ConformanceViolation`     | type | One DTO drift -- `rule` / `schema` / `field` / `message`         |
| `OpenApiDocument`          | type | Parsed-spec shape read by the schema oracle (component schemas)  |
| `EndpointViolation`        | type | One route drift -- `rule` / `module` / `method` / `route`        |
| `OpenApiPaths`             | type | Parsed-spec shape read by the endpoint oracle (`paths` only)     |

`src/manifest.ts` (`CONTRACTS`, `ModuleContract`) is the coverage registry; it is
not re-exported from the barrel — it is internal to the test suite.

## Refreshing the snapshots

The specs are authoritative artifacts, vendored from four backend OpenAPI
generators. Re-vendor them with the workspace script:

```bash
node scripts/sync-openapi-contracts.mjs            # all modules
node scripts/sync-openapi-contracts.mjs background-jobs
```

Override each generator's source repo with its env var:

| Generator                           | Repo            | Env var           |
| ----------------------------------- | --------------- | ----------------- |
| `Granit.OpenApi.Generator`          | granit-dotnet   | `GRANIT_DOTNET`   |
| `Granit.Cms.OpenApi.Generator`      | granit-website  | `GRANIT_WEBSITE`  |
| `Granit.IoT.OpenApi.Generator`      | granit-iot      | `GRANIT_IOT`      |
| `Granit.Business.OpenApi.Generator` | granit-business | `GRANIT_BUSINESS` |

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

The oracle resolves each interface, brands (`EntityId<…>`, `ISODateString`),
local string-union aliases, `$ref` enums, generic instantiations (cross-package
`Foo<PartyId>`), and both `interface X {}` and `type X = {…}` DTOs automatically,
following `import type` / `export … from` edges up to a bounded depth.

## Out of scope / caveats

- **Not a code generator.** This package never emits or rewrites the curated
  DTOs; it only asserts they have not drifted. Fixes are made by hand on the
  failing front type — that is the deliberate tradeoff over Orval.
- **Coarse, not exact.** The comparison is field presence + nullability + type
  *family* (`string` / `number` / `boolean` / `array` / `object`). It does not
  check string formats, numeric ranges, enum membership, or exact branded
  identity — those are representation concerns the normalization table
  intentionally absorbs. `unknown` / `any` fields tolerate any backend value.
- **Name-aligned only.** A module is oracle-checkable only once its front DTO
  names match the spec schema names; modules whose front names still diverge
  (or whose shapes the field-by-field oracle cannot flatten — `extends`-flattened
  wire shapes, non-discriminated unions, mapped types) are left unregistered in
  `manifest.ts` until renamed or remodeled.
- **Endpoint check is opt-in.** Route/verb conformance only runs for entries
  with `checkEndpoints: true`, and only sees `client.METHOD()` calls under
  `api/`; routes served by native `fetch` (BFF auth bootstrap) or the
  query-engine generic surface (`''`, `'/meta'`) must be excluded via
  `endpointIgnore`.
