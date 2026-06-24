# @granit/react-settings

React hooks + provider for the Granit **settings** module — reading and writing
scoped key/value settings (`user` / `global` / `tenant`) plus the admin
definitions catalog and bulk-update surface. This is the **React hooks layer**:
it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/settings`](../settings) in TanStack Query hooks behind a shared
`SettingsProvider` that resolves the Axios client, base path, and query-key
prefix. It renders nothing — typed fields, encrypted-secret handling, and the
bulk-save form live one layer up.

The split is three packages over the same .NET `Granit.Settings` backend
(contract: `contracts/openapi/settings.json`):

- [`@granit/settings`](../settings) — framework-agnostic core: DTOs + Axios
  functions (`getSetting`, `getSettings`, `updateSetting`, `deleteSetting`,
  `getAdminAppSettings`, `bulkUpdateSettings`), `SETTING_NAMES`, and
  `SettingsPermissions`.
- `@granit/react-settings` (this package) — React Query hooks + provider.
- [`@granit/react-ui-settings`](../react-ui-settings) — admin UI kit: the
  application-settings edit page and dynamic settings panel (typed fields,
  encrypted-secret reset flow, bulk save).

A setting resolves through a cascade — **User → Tenant → Global → Config →
Default** — so a read returns the first effective value for the requested scope,
and clearing a user override (`useDeleteSetting`) falls back to the next level.
Values are always wire-encoded as `string | null`; `valueKind` on the admin
catalog tells the UI which typed control to render.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/settings` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-settings/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. Hooks take an explicit
`scope`; mutation values are wire strings (`string | null`).

```tsx
import {
  SettingsProvider,
  useSetting,
  useUpdateSetting,
} from '@granit/react-settings';
import { SETTING_NAMES } from '@granit/settings';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <SettingsProvider config={{ client: useGranitClient(), basePath: '/api/v1' }}>
      {children}
    </SettingsProvider>
  );
}

function CulturePicker() {
  const { data } = useSetting('user', SETTING_NAMES.PREFERRED_CULTURE);
  const { update, isPending } = useUpdateSetting('user');

  return (
    <select
      value={data?.value ?? ''}
      disabled={isPending}
      onChange={(e) => update(SETTING_NAMES.PREFERRED_CULTURE, e.target.value)}
    >
      <option value="en">English</option>
      <option value="fr">Français</option>
    </select>
  );
}
```

`useUpdateSetting` invalidates both the scope query and the individual setting
key on success; `useDeleteSetting` (user scope only) resets an override to the
cascade default. Admin screens read the typed catalog and batch-write it:

```tsx
import {
  useAdminAppSettings,
  useBulkUpdateSettings,
} from '@granit/react-settings';
import type { BulkSettingEntry } from '@granit/settings';

function GlobalSettingsForm() {
  const { data: catalog } = useAdminAppSettings('global');
  const { mutate, isPending } = useBulkUpdateSettings('global');

  const save = (entries: readonly BulkSettingEntry[]) => mutate(entries);

  // catalog[i]: { key, label, description, valueKind, allowedValues,
  //   isEncrypted, value, defaultValue } — enough to render a typed control.
  return <SettingsTable rows={catalog} onSave={save} saving={isPending} />;
}
```

## Public API

| Symbol                        | Kind     | Purpose                                                               |
| ----------------------------- | -------- | --------------------------------------------------------------------- |
| `SettingsProvider`            | provider | Resolves client / base path / query-key prefix for all hooks below it |
| `useSettingsConfig`           | hook     | Read the resolved config; throws outside a provider                   |
| `useSetting`                  | hook     | `GET {basePath}/settings/{scope}/{name}` — one setting value          |
| `useSettings`                 | hook     | `GET {basePath}/settings/{scope}` — flat key/value map for a scope    |
| `useUpdateSetting`            | hook     | `PUT .../{scope}/{name}` mutation (`update` / `updateAsync`)          |
| `useDeleteSetting`            | hook     | `DELETE .../user/{name}` mutation; resets to the cascade default      |
| `useAdminAppSettings`         | hook     | `GET .../{scope}/definitions` — typed admin catalog (5 min staleTime) |
| `useBulkUpdateSettings`       | hook     | `PUT .../{scope}/bulk` — batch write; per-entry outcome envelope      |
| `buildSettingsQueryKey`       | fn       | Query-key factory honoring the configured `queryKeyPrefix`            |
| `SettingsConfig`              | type     | Provider input (optional client / basePath / queryKeyPrefix)          |
| `SettingsProviderProps`       | type     | `{ config, children }`                                                |
| `UseUpdateSettingReturn`      | type     | `{ update, updateAsync, isPending, error }`                           |
| `UseDeleteSettingReturn`      | type     | `{ remove, removeAsync, isPending, error }`                           |
| `BulkUpdateSettingsVariables` | type     | `readonly BulkSettingEntry[]` — input to `useBulkUpdateSettings`      |

DTOs (`SettingScope`, `SettingsMap`, `SettingValueResponse`,
`AdminAppSettingResponse`, `BulkSettingEntry`, `BulkUpdateSettingsResponse`,
`ValueKind`, …), well-known `SETTING_NAMES`, and `SettingsPermissions` are
re-exported from [`@granit/settings`](../settings), not from this package.

`./testing` subpath (requires the optional `msw` peer): `createSettingsHandlers`
(stateful MSW handlers — PUT/DELETE are reflected in subsequent GETs, default
base `/api/v1`) plus the `mockAppSettings` catalog and `mockSettingsStore`
fixtures.

## Caveats

- **`useUpdateSetting(scope)` and `useDeleteSetting()` take a scope up front;
  the imperative call passes `(name, value)`.** `useDeleteSetting` is user-scope
  only — to clear a global or tenant override call `useUpdateSetting` with
  `value === null`. (Earlier docs showed a `{ key, value }` object form — that
  is not the current signature.)
- **Bulk updates always resolve to HTTP 200 when the body parses.** The status
  does not reflect per-entry success: `useBulkUpdateSettings` returns the
  `BulkUpdateSettingsResponse` envelope and the caller must filter
  `outcome !== 'Updated'` (e.g. `NotFound`, `ProviderNotAllowed`,
  `ValidationFailed`) to surface failures. `errorCode` is a machine-readable
  i18n key (`Granit:Settings:*`), resolved by the host's localization endpoint.
- **Encrypted secrets are write-only.** The backend returns `"***"` for any
  `isEncrypted` definition; never echo that placeholder back on save — the admin
  UI must offer a reset-then-rewrite flow rather than an editable value.
- **Permission checks are a UX hint, not a security boundary.** Use
  `SettingsPermissions` (from [`@granit/settings`](../settings)) to hide admin
  controls, but `Granit.Settings` re-checks authorization on every endpoint —
  the browser is hostile territory.

## Out of scope

- **Rendering** — the settings edit page and dynamic panel live in
  [`@granit/react-ui-settings`](../react-ui-settings). This package is headless.
- **DTOs, HTTP transport, permission constants** — owned by
  [`@granit/settings`](../settings) (mirror of `Granit.Settings`); hooks here
  only adapt them to React Query.
- **i18n of setting labels / option values / `errorCode`s** — the consuming app
  resolves the `Setting:{key}:*` and `Granit:Settings:*` keys against the host
  localization endpoint.

## License

Apache-2.0
