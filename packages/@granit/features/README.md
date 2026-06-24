# @granit/features

Tenant-agnostic **feature-flag** SDK — the framework-level TypeScript counterpart
of the .NET `Granit.Features` module. It exposes the wire types, HTTP client
functions and permission constants needed to read feature definitions, resolve
their values and manage tenant-level overrides from any client (React, React
Native, a CLI, tests). It holds **no** React, DOM or Node-only dependency.

This is the framework-agnostic core of a three-package split:

- `@granit/features` (this package) — types + Axios calls + permissions.
- [`@granit/react-features`](../react-features) — React Query hooks + provider.
- [`@granit/react-ui-features`](../react-ui-features) — admin UI feature kit.

A feature has a `valueType` of `Toggle`, `Numeric` or `Selection`; its resolved
value is always a string. Definitions are read-only declarations; overrides are
per-tenant mutations layered on top of each definition's `defaultValue`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
`@granit/api-client` as a peer (the source of the `AxiosInstance` every call
takes).

## Quick start

```ts
import {
  getFeatureDefinitions,
  getAllFeatureValues,
  setFeatureOverride,
  deleteFeatureOverride,
} from '@granit/features';

// `basePath` is the module's route root — e.g. '/features'.
const basePath = '/features';

// 1. Read the declared features, grouped by name prefix.
const groups = await getFeatureDefinitions(client, basePath);

// 2. Resolve every flag for the current tenant (name -> string value).
const values = await getAllFeatureValues(client, basePath);
const darkMode = values['Acme.DarkMode'] === 'true';

// 3. Set a tenant override; pass the value as a string regardless of valueType.
await setFeatureOverride(client, basePath, 'Acme.DarkMode', { value: 'true' });

// 4. Revert to the definition's defaultValue.
await deleteFeatureOverride(client, basePath, 'Acme.DarkMode');
```

## Public API

| Symbol                             | Kind  | Purpose                                                   |
| ---------------------------------- | ----- | --------------------------------------------------------- |
| `FeatureGroupResponse`             | type  | A named group of definitions (grouped by name prefix)     |
| `FeatureDefinitionResponse`        | type  | One flag: `valueType`, `defaultValue`, constraints        |
| `FeatureNumericConstraintResponse` | type  | `min`/`max` bounds for a `Numeric` feature                |
| `FeatureValueResponse`             | type  | A resolved single value (`name` + string `value`)         |
| `SetFeatureOverrideRequest`        | type  | `PUT .../overrides/{name}` body (`{ value: string }`)     |
| `getFeatureDefinitions`            | fn    | `GET {basePath}/definitions` returns grouped definitions  |
| `getAllFeatureValues`              | fn    | `GET {basePath}/values` returns `Record<name, string>`    |
| `getFeatureValue`                  | fn    | `GET {basePath}/values/{name}` returns one value          |
| `setFeatureOverride`               | fn    | `PUT {basePath}/overrides/{name}` (tenant override)       |
| `deleteFeatureOverride`            | fn    | `DELETE {basePath}/overrides/{name}` (revert to default)  |
| `FeaturesPermissions`              | const | Permission strings: `Features.Flags.Read` / `…Manage`     |

## Out of scope / caveats

- **Values are always strings.** `Toggle` resolves to `'true'`/`'false'`,
  `Numeric` to a stringified number, `Selection` to one of
  `selectionValues` — callers parse per `valueType`. The backend mirrors a
  `IReadOnlyDictionary<string, string>`; `getAllFeatureValues` keeps that shape.
- **Overrides are tenant-scoped.** The active tenant is resolved server-side
  from the `X-Tenant-Id` header injected by `@granit/api-client`; these calls
  never carry a tenant argument.
- **Read vs. manage are distinct permissions.** Reading definitions/values
  requires `Features.Flags.Read`; setting or deleting an override requires
  `Features.Flags.Manage`. Client-side checks are a UX hint only — the .NET
  backend enforces both on every endpoint.
- **No React here.** Query-key factories, hooks and the provider live in
  [`@granit/react-features`](../react-features); the admin screens live in
  [`@granit/react-ui-features`](../react-ui-features).

## License

Apache-2.0
