# @granit/react-validation

React bindings for the Granit **validation** module — a react-hook-form resolver
factory, HTML input-prop generation, and debounced server-side field validation.
This is the **React hooks layer**: it wraps the framework-agnostic constraint
helpers and Axios calls from [`@granit/validation`](../validation) in React hooks
plus a small `ValidationProvider` for shared client/base-path wiring. It renders
nothing — inputs, forms, and error rendering live in the consuming app.

The split is two packages over the same .NET `Granit.Validation` backend
(contract: `contracts/openapi/validation.json`, routes `/validation/validate`,
`/validation/validate-batch`, `/validation/validators`):

- [`@granit/validation`](../validation) — framework-agnostic core: OpenAPI
  constraint extraction (`extractConstraints`), pure client-side validation
  (`validateField`, `getInputProps`), error-code constants, and the Axios
  server-validation calls (`validateFieldServer`, `validateFieldsBatch`,
  `listValidators`).
- `@granit/react-validation` (this package) — React resolver/hooks + provider.

There is no `react-ui-validation` admin feature kit; validation is a forms
primitive consumed directly by app forms, not an admin surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/validation` — core constraint types + pure/HTTP validation functions
  this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) used by the server-validation hooks.
- `@granit/logger` — `createLogger`; server-validation request failures are
  logged, never thrown to the UI.
- `react` (`^19`).

`react-hook-form` is **not** a peer dependency: `createConstraintsResolver`
returns a structurally-compatible `Resolver` shape so the package stays
form-library-agnostic. A translation function (`i18next`-compatible `t`) is
passed in by the caller; there is no hard i18n dependency either.

## Quick start

`SchemaConstraints` come from the core package — extract them once from an
OpenAPI spec with `extractConstraints`, then feed them to the resolver and hooks.
Pass your own `t` (any `(key, params?) => string`); the resolver and hooks emit
error-code / validator keys for it to localize.

```tsx
import { extractConstraints } from '@granit/validation';
import {
  ValidationProvider,
  createConstraintsResolver,
  useFieldProps,
  useServerValidation,
} from '@granit/react-validation';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

// Once, at module load — derive constraints from the request schema.
const constraints = extractConstraints(openApiSpec, 'CreateUserRequest');

function CreateUserForm() {
  const { t } = useTranslation();
  const resolver = createConstraintsResolver(constraints, t);
  const { register, handleSubmit, watch } = useForm({ resolver });

  // HTML attributes (required, minLength, pattern, …) + optional hints.
  const email = useFieldProps(constraints, 'email', t);

  // Debounced async check against the .NET validator for `email`.
  const server = useServerValidation({
    client: useValidationClient(),
    constraint: constraints.email!,
    value: watch('email'),
    t,
  });

  return (
    <form onSubmit={handleSubmit(/* … */)}>
      <input {...register('email')} {...email.inputProps} aria-describedby="email-hint" />
      {email.serverHint && <small id="email-hint">{email.serverHint}</small>}
      {server.status === 'invalid' && <span role="alert">{server.message}</span>}
    </form>
  );
}
```

Mount the provider once near the form tree so the server-validation hooks can
read a shared Axios client and base path instead of threading them per call:

```tsx
import { ValidationProvider, useValidationConfig } from '@granit/react-validation';
import { useGranitClient } from '@granit/react-api-client';

function FormSection({ children }: { children: React.ReactNode }) {
  return (
    <ValidationProvider client={useGranitClient()} basePath="/api/v1/validation">
      {children}
    </ValidationProvider>
  );
}

// `useValidationConfig()` reads { client, basePath }; throws outside a provider.
function useValidationClient() {
  return useValidationConfig().client;
}
```

For a form with several server-validated fields, prefer
`useServerValidationBatch` — it coalesces N validators into a single
`/validation/validate-batch` round-trip:

```tsx
import { useServerValidationBatch } from '@granit/react-validation';

const states = useServerValidationBatch({
  client,
  t,
  fields: [
    { name: 'email', constraint: constraints.email!, value: values.email },
    { name: 'username', constraint: constraints.username!, value: values.username },
  ],
});
// states.email?.status === 'invalid' | 'valid' | 'validating' | 'error' | undefined
```

## Public API

| Symbol                            | Kind     | Purpose                                                                |
| --------------------------------- | -------- | ---------------------------------------------------------------------- |
| `ValidationProvider`              | provider | Supplies a shared Axios `client` + optional `basePath` to the hooks    |
| `useValidationConfig`             | hook     | Read `{ client, basePath }`; throws outside a `ValidationProvider`     |
| `createConstraintsResolver`       | fn       | Build a react-hook-form-compatible `Resolver` from `SchemaConstraints` |
| `useFieldProps`                   | hook     | Memoized HTML `inputProps` + optional `serverHint` / `patternHint`     |
| `useServerValidation`             | hook     | One field, debounced async check vs. its `granitValidator` server rule |
| `useServerValidationBatch`        | hook     | Many fields → one batched server round-trip; map of per-field states   |
| `ConstraintsResolver`             | type     | The `Resolver`-shaped return of `createConstraintsResolver`            |
| `ConstraintsResolverOptions`      | type     | `labelResolver` (`{PropertyName}`) + `patternHintSeparator`            |
| `TranslateFunction`               | type     | `(key, params?) => string` — `i18next`-compatible, no hard dependency  |
| `FieldPropsResult`                | type     | `{ inputProps, serverHint?, patternHint? }`                            |
| `ServerValidationState`           | type     | `{ status: idle\|validating\|valid\|invalid\|error, message? }`        |
| `UseServerValidationOptions`      | type     | `useServerValidation` input (client, constraint, value, t, …)          |
| `BatchFieldSpec`                  | type     | `{ name, constraint, value }` for one batched field                    |
| `ServerValidationBatchState`      | type     | `Readonly<Record<fieldName, ServerValidationState>>`                   |
| `UseServerValidationBatchOptions` | type     | `useServerValidationBatch` input (client, fields, t, …)                |
| `ValidationConfig`                | type     | `{ client, basePath? }` — the provider's value                         |

Defaults: both server-validation hooks debounce at `400ms`, are `enabled` by
default, and accept an optional `basePath` (falling back to the API client's
configured base). Constraint types (`SchemaConstraints`, `FieldConstraint`,
`InputConstraintProps`, …) and the pure functions are re-exported from
[`@granit/validation`](../validation) — import them from there, not here.

## Caveats

- **Server validation is non-blocking UX, not the gate.** The hooks skip the
  server call when the field has no `granitValidator`, the value is empty, or
  client-side `validateField` already fails — and they swallow network errors
  into `status: 'error'` (logged via `@granit/logger`, never thrown). The .NET
  endpoint is still the authority; the resolver and async hooks only surface
  hints earlier. Always submit and let the backend re-validate every field.
- **Values are coerced to `string` for the wire.** The `/validation/validate`
  endpoint expects `string?`; non-string values are passed through `String(v)`
  before the request. Server validators are intended for scalar text fields
  (uniqueness, format lookups), not structured payloads.
- **i18n is the caller's job.** The resolver returns the error `code` as the
  field error `type` and a message produced by your `t`; `useFieldProps`,
  `useServerValidation`, and the batch hook resolve `granitValidator` /
  `patternHint` keys through the same `t`. This package ships no `locales/` —
  the keys are owned by the backend `Granit.Validation` error-code convention.
- **Deliberately not TanStack Query.** `useServerValidation` and
  `useServerValidationBatch` use `useState`/`useEffect` with an `AbortController`
  on purpose: React Query's caching and retry semantics conflict with real-time,
  debounced, abort-on-change field validation. Do not "upgrade" them to query
  hooks.

## Out of scope

- **Constraint extraction & pure validation** — `extractConstraints`,
  `validateField`, `getInputProps`, and the error-code constants are owned by
  [`@granit/validation`](../validation) (mirror of `Granit.Validation`); this
  package only adapts them to React.
- **Form state** — `react-hook-form` (or any form library) is the caller's
  choice; `createConstraintsResolver` only produces a compatible resolver.
- **Rendering** — inputs, labels, error/hint markup, and field layout are the
  app's responsibility; this package is headless.

## License

Apache-2.0
