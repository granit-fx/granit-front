# @granit/validation

Spec-driven form **validation** primitives — the framework-agnostic TypeScript
counterpart of the .NET `Granit.Validation` module (`granit-dotnet/src/Granit.Validation`,
endpoints in `Granit.Validation.Endpoints`; contract: `contracts/openapi/validation.json`).

This is the framework-agnostic **core** layer. It extracts field constraints from an
OpenAPI 3.x spec, derives safe HTML input attributes, runs client-side field checks that
emit backend-aligned error codes, and wraps the server-side validator endpoints. It holds
no React or DOM dependency — the React Query hooks, the `ValidationProvider`, and the
react-hook-form resolver live one layer up in
[`@granit/react-validation`](../react-validation). There is no `react-ui` admin feature
kit; validation is a behaviour woven into every form, not a standalone screen.

The central idea is that the OpenAPI spec is the single source of truth: instead of
hand-writing Zod schemas, you `extractConstraints(spec)` once and let `validateField`
produce errors whose `code` is the same `Validation:Builtin:*` key the .NET backend uses,
so the localized message catalog is shared end to end.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to a
public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into the server-validation calls (`listValidators`, `validateFieldServer`,
  `validateFieldsBatch`). The constraint-extraction and client-side validation helpers are
  pure and need no peer.

## Quick start

Extract constraints from an OpenAPI spec once, then derive input props and validate
values. Error codes round-trip to the shared i18n catalog:

```ts
import {
  extractConstraints,
  getInputProps,
  validateField,
} from '@granit/validation';

// Pull constraints for one schema (resolves $ref and merges allOf compositions).
const constraints = extractConstraints(openApiSpec, { schemas: ['CreateUserRequest'] });
const emailField = constraints['CreateUserRequest']!['email']!;

// Safe HTML attributes — no `required`/`minLength`/`pattern` (see Caveats).
const props = getInputProps(emailField); // e.g. { type: 'email', maxLength: 256 }

// Client-side check. Errors carry a backend-aligned code + params for i18n interpolation.
const errors = validateField('not-an-email', emailField);
// [{ code: 'Validation:Builtin:Email' }]
```

For server-only rules (e.g. uniqueness, business validators advertised via
`x-granit-validator`), call the validation endpoints with the Axios client:

```ts
import {
  listValidators,
  validateFieldServer,
  validateFieldsBatch,
} from '@granit/validation';
import { useGranitClient } from '@granit/react-api-client';

const client = useGranitClient();

// Discover which error codes can be validated in real time.
const available = await listValidators(client); // GET /api/v1/validation/validators

// Single field — returns 'Valid' | 'Invalid' | 'ValidatorNotFound'.
const status = await validateFieldServer(client, 'Identity:Email:Unique', 'a@b.com');

// Batch (server caps at 20); unknown codes return 'ValidatorNotFound' per entry,
// they do not fail the whole request.
const results = await validateFieldsBatch(client, [
  { errorCode: 'Identity:Email:Unique', value: 'a@b.com' },
  { errorCode: 'Identity:Username:Unique', value: 'jdoe' },
]);
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `extractConstraints` | fn | Spec → `SpecConstraints`; resolves `$ref`, merges `allOf`, filters |
| `getInputProps` | fn | `FieldConstraint` → tooltip-safe HTML input attrs (`type`/`max`/`min`) |
| `validateField` | fn | Client-side check → `FieldValidationError[]` with backend codes |
| `isEmptyFieldValue` | fn | `undefined`/`null`/blank-string guard for optional-field skipping |
| `listValidators` | fn | `GET {base}/validators` — registered server validator error codes |
| `validateFieldServer` | fn | `POST {base}/validate` — one field → `ValidationFieldStatus` |
| `validateFieldsBatch` | fn | `POST {base}/validate-batch` — up to 20 fields in one round-trip |
| `VALIDATION_ERROR_CODES` | const | Constraint kind → `Validation:Builtin:*` i18n key map |
| `ValidationErrorCode` | type | Union of the `VALIDATION_ERROR_CODES` values |
| `OpenApiSpec` / `OpenApiSchema` | type | Minimal OpenAPI 3.x document/schema subset accepted by extraction |
| `OpenApiSchemaProperty` / `…Ref` | type | Property + `$ref`/`allOf` shapes (incl. `x-granit-*` extensions) |
| `ExtractOptions` | type | `{ schemas?, schemaPattern? }` extraction filter |
| `FieldConstraint` | type | One field's extracted constraints (length/range/pattern/format) |
| `SchemaConstraints` / `SpecConstraints` | type | `field → FieldConstraint` and `schema → SchemaConstraints` maps |
| `InputConstraintProps` | type | Shape returned by `getInputProps` |
| `FieldValidationError` | type | `{ code, params? }` emitted by `validateField` |
| `ValidationFieldStatus` | type | `'Valid' \| 'Invalid' \| 'ValidatorNotFound'` |
| `ValidationFieldValidate*Request/Response` | type | Wire DTOs mirroring the `Granit.Validation` endpoints |

The server-validation calls default to a `/api/v1/validation` base path; every function
takes a `basePath` override as its last positional argument before the optional
`AbortSignal`.

## Caveats

- **`getInputProps` deliberately omits `required`, `minLength`, and `pattern`.** Those
  attributes trigger native browser validation tooltips that clash with the resolver's
  localized error messages. Only `type` (email), `maxLength`, and `min`/`max` (number
  spinners, with exclusive bounds normalized to `±1`) are emitted. The full rule set still
  runs through `validateField`.
- **`validateField` skips server-only `granitValidator` constraints.** A field carrying
  `x-granit-validator` (extracted as `granitValidator`) cannot be checked client-side;
  route it through `validateFieldServer` / `validateFieldsBatch` instead.
- **Client checks are a UX layer, not enforcement.** The .NET backend re-validates every
  submission. Matching error codes keep the two in sync, but never treat a clean
  client-side pass as authoritative.
- **`required` comes from the schema's `required` array, not nullability.** `extractConstraints`
  reads `required` per schema (merging `allOf`), independently of whether the property type
  is nullable — consistent with the framework's OpenAPI-`required` convention.

## Out of scope

- **React integration** — the `ValidationProvider`, the `createConstraintsResolver`
  react-hook-form resolver, and the `useFieldProps` / `useServerValidation` hooks live in
  [`@granit/react-validation`](../react-validation). This package is headless.
- **The error-message catalog** — `VALIDATION_ERROR_CODES` yields i18n *keys*; the actual
  localized strings are owned by the consuming app's translation bundles and the backend
  `Granit.Validation` resources.
- **Region/domain validators** — locale- and domain-specific rule packs
  (`Granit.Validation.Europe`, `.Finance`, `.NorthAmerica`, …) are backend-side; the front
  discovers them by error code via `listValidators`, it does not reimplement them.

## License

Apache-2.0
