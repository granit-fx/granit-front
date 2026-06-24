# @granit/react-features

React hooks + provider for the Granit **features** module — feature-flag
definitions, resolved values, and tenant-level override management. This is the
**React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/features`](../features) in TanStack Query hooks behind a shared
`FeaturesProvider` for client / base-path / query-key configuration. It holds no
rendering — listing cards, value badges, and the override dialog live one layer
up.

The split is three packages over the same .NET `Granit.Features` backend
(contract: `contracts/openapi/features.json`):

- [`@granit/features`](../features) — framework-agnostic core: DTOs + Axios
  functions (`getFeatureDefinitions`, `getAllFeatureValues`, `setFeatureOverride`,
  …) and the `FeaturesPermissions` constants.
- `@granit/react-features` (this package) — React Query hooks + provider.
- [`@granit/react-ui-features`](../react-ui-features) — admin UI kit:
  `FeatureListPage`, `FeatureDetailPage`, and the set / remove-override dialog.

A feature is a named flag with a `valueType` (`Toggle` / `Numeric` / `Selection`),
a `defaultValue`, and optional numeric or selection constraints. Resolved values
are per-tenant: the backend returns the default unless a tenant override is set,
and overrides are written/cleared through this layer's mutations.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/features` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-features/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { FeaturesProvider, useFeatureValue } from '@granit/react-features';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <FeaturesProvider config={{ client: useGranitClient() }}>
      {children}
    </FeaturesProvider>
  );
}

function DarkModeShell({ children }: { children: React.ReactNode }) {
  // Disabled automatically until `name` is non-empty; values are strings.
  const { data: flag } = useFeatureValue('ui.dark-mode');
  return <div className={flag?.value === 'true' ? 'dark' : 'light'}>{children}</div>;
}
```

The provider defaults `basePath` to `/api/v1/features` and the query-key prefix to
`['features']`. Admin screens combine the definition/value queries with the
override mutations, which invalidate the `definitions` and `values` queries on
success:

```tsx
import {
  useDeleteFeatureOverride,
  useFeatureDefinitions,
  useSetFeatureOverride,
} from '@granit/react-features';

function FeatureAdmin() {
  const { data: groups } = useFeatureDefinitions();
  const setOverride = useSetFeatureOverride();
  const clearOverride = useDeleteFeatureOverride();

  return groups?.flatMap((g) =>
    g.features.map((f) => (
      <Row
        key={f.name}
        label={f.displayName ?? f.name}
        onSet={(value) => setOverride.mutate({ name: f.name, request: { value } })}
        onReset={() => clearOverride.mutate(f.name)}
      />
    ))
  );
}
```

## Public API

| Symbol                        | Kind     | Purpose                                                                |
| ----------------------------- | -------- | ---------------------------------------------------------------------- |
| `FeaturesProvider`            | provider | Supplies client, base path, query-key prefix to all hooks below it     |
| `useFeaturesConfig`           | hook     | Read the resolved config; throws outside a provider                    |
| `useFeatureDefinitions`       | hook     | `GET .../definitions` — feature definitions grouped by category        |
| `useFeatureValues`            | hook     | `GET .../values` — all resolved values as a `Record<string,string>`    |
| `useFeatureValue`             | hook     | `GET .../values/{name}` — one resolved value (skipped if `name` empty) |
| `useSetFeatureOverride`       | hook     | `PUT .../overrides/{name}` mutation; invalidates definitions+values    |
| `useDeleteFeatureOverride`    | hook     | `DELETE .../overrides/{name}` mutation; reverts to the default value   |
| `buildFeaturesQueryKey`       | fn       | Query-key factory honoring the configured `queryKeyPrefix`             |
| `FeaturesConfig`              | type     | Provider input (optional client / basePath / queryKeyPrefix)           |
| `FeaturesProviderProps`       | type     | `{ config, children }`                                                 |
| `SetFeatureOverrideVariables` | type     | `{ name, request }` input for the set-override mutation                |

The DTOs (`FeatureGroupResponse`, `FeatureDefinitionResponse`,
`FeatureValueResponse`, `SetFeatureOverrideRequest`,
`FeatureNumericConstraintResponse`) and the `FeaturesPermissions` constants are
owned by [`@granit/features`](../features); import them from there.

### `./testing` subpath

Requires the optional `msw` peer. Re-exports `createFeaturesHandlers` (stateful
MSW handlers, default base `/api/v1/features`) — override `PUT`/`DELETE` calls
mutate an in-memory value dictionary that subsequent `GET`s reflect, and `PUT`
validates the body against the definition's `valueType` (Toggle / Numeric bounds /
Selection allow-list, `422` on failure). Ships the `mockFeatureGroups`,
`mockFeatureDefinitions`, and `mockFeatureValues` fixtures. Import shared fixtures
from here rather than hand-rolling DTOs inline.

## Caveats

- **Values are strings.** `valueType` is metadata describing how to parse a value;
  the wire shape of every value is a `string` (`'true'` / `'3'` / `'compact'`).
  Coerce in the caller — `flag.value === 'true'`, `Number(flag.value)`.
- **Overrides are tenant-scoped.** Resolved values come from the active tenant
  (`X-Tenant-Id` injected by `@granit/api-client`); a `setFeatureOverride` affects
  only the current tenant, and `deleteFeatureOverride` reverts to the definition
  `defaultValue` rather than deleting the flag.
- **No single-value invalidation.** The override mutations invalidate the
  `definitions` and `values` collection queries; per-name `useFeatureValue` queries
  refresh transitively. There is no targeted single-value invalidation.

## Out of scope

- **Rendering** — listing cards, value badges, the detail page, and the
  set / remove-override dialog live in
  [`@granit/react-ui-features`](../react-ui-features). This package is headless.
- **DTOs, HTTP transport, and permission constants** — owned by
  [`@granit/features`](../features) (mirror of `Granit.Features`); hooks here only
  adapt them to React Query.
- **Authorization enforcement** — `FeaturesPermissions` (`Features.Flags.Read` /
  `Features.Flags.Manage`) gate the UI; the .NET backend is the authoritative check
  on every endpoint.

## License

Apache-2.0
