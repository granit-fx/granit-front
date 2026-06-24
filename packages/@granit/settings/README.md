# @granit/settings

Scope-aware **settings** SDK — the framework-level TypeScript counterpart of the
.NET `Granit.Settings` module (contract: `contracts/openapi/settings.json`).

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios HTTP
client and the well-known constants needed to read and write settings from any
client — React, React Native, a CLI, tests. It holds **no** React, DOM or Node-only
dependency. The React Query hooks + provider live in
[`@granit/react-settings`](../react-settings); the admin feature kit (app-settings
edit page, panel, i18n bundles) lives in
[`@granit/react-ui-settings`](../react-ui-settings).

Settings cascade across three **scopes** — `user`, `tenant`, `global` — resolved
server-side; a `user` override shadows `tenant`, which shadows `global`. Reads are
flat key/value maps; writes are per-key (`updateSetting`) or batched per scope
(`bulkUpdateSettings`). Admin scopes (`global`/`tenant`) additionally expose typed
**definitions** (`valueKind`, `allowedValues`, `isEncrypted`, defaults) to drive an
admin UI; the per-user scope has no definitions or bulk form, only a `deleteSetting`
reset that re-exposes the inherited value.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.

## Quick start

```ts
import {
  getSettings,
  getSetting,
  updateSetting,
  deleteSetting,
  getAdminAppSettings,
  bulkUpdateSettings,
  SETTING_NAMES,
} from '@granit/settings';

// `basePath` is the host's settings mount root; routes hang off `/settings/...`.
const basePath = '/api/v1';

// 1. Read the resolved cascade for a scope — a flat { name: value } map.
const map = await getSettings(client, basePath, 'user');
const culture = map[SETTING_NAMES.PREFERRED_CULTURE]; // string | undefined

// 2. Read / write a single user override.
const tz = await getSetting(client, basePath, 'user', SETTING_NAMES.PREFERRED_TIMEZONE);
await updateSetting(client, basePath, 'user', SETTING_NAMES.PREFERRED_TIMEZONE, {
  value: 'Europe/Brussels',
});

// 3. Reset the user override so the tenant/global value takes over again.
await deleteSetting(client, basePath, 'user', SETTING_NAMES.PREFERRED_TIMEZONE);

// 4. Admin: list typed definitions, then batch-update a scope.
const defs = await getAdminAppSettings(client, basePath, 'tenant'); // 'global' | 'tenant'
const { results } = await bulkUpdateSettings(client, basePath, 'tenant', [
  { key: defs[0]!.key, value: 'true' },
  { key: 'Granit.Some.Unknown', value: null }, // null clears the override
]);

// HTTP 200 does NOT mean every entry succeeded — inspect per-entry outcomes.
const failures = results.filter((r) => r.outcome !== 'Updated');
```

## Public API

| Symbol                       | Kind  | Purpose                                                      |
| ---------------------------- | ----- | ------------------------------------------------------------ |
| `SettingScope`               | type  | `user` / `global` / `tenant` — routing scope                 |
| `AdminSettingsScope`         | type  | `global` / `tenant` — scopes with definitions + bulk         |
| `SettingsMap`                | type  | `Record<string, string>` — flat resolved map; absent = unset |
| `SettingValueResponse`       | type  | `{ name, value }` for one setting (`value` nullable)         |
| `UpdateSettingValueRequest`  | type  | `PUT` body; `value: null` clears, omitted leaves unchanged   |
| `ValueKind`                  | type  | `String`/`Bool`/`Int`/`Double`/`Json` — definition shape     |
| `AdminAppSettingResponse`    | type  | One admin definition (label, default, `allowedValues`, etc.) |
| `BulkSettingEntry`           | type  | `{ key, value }` entry; `value: null` clears the override    |
| `BulkUpdateSettingsRequest`  | type  | `{ settings }` body for `PUT .../bulk`                       |
| `BulkSettingOutcome`         | type  | `Updated`/`NotFound`/`ProviderNotAllowed`/`ValidationFailed` |
| `BulkSettingResult`          | type  | Per-entry result (`outcome` + machine-readable `errorCode`)  |
| `BulkUpdateSettingsResponse` | type  | `{ results }` — always 200; inspect per entry                |
| `getSettings`                | fn    | `GET {basePath}/settings/{scope}` — flat map                 |
| `getSetting`                 | fn    | `GET {basePath}/settings/{scope}/{name}`                     |
| `updateSetting`              | fn    | `PUT {basePath}/settings/{scope}/{name}`                     |
| `deleteSetting`              | fn    | `DELETE {basePath}/settings/user/{name}` — user scope only   |
| `getAdminAppSettings`        | fn    | `GET {basePath}/settings/{scope}/definitions`                |
| `bulkUpdateSettings`         | fn    | `PUT {basePath}/settings/{scope}/bulk`                       |
| `SETTING_NAMES`              | const | Well-known setting keys (preferred culture / timezone)       |
| `SettingsPermissions`        | const | `Settings.{Global,Tenant}.{Read,Manage}` permission strings  |

## Caveats

- **Bulk success is per-entry, not per-request.** `bulkUpdateSettings` resolves with
  HTTP 200 whenever the request envelope parses; a `422` is returned **only** for
  structural failures (empty list, too many entries). Always filter
  `results.filter((r) => r.outcome !== 'Updated')` to surface `NotFound`,
  `ProviderNotAllowed`, or `ValidationFailed` entries. Each failed entry carries an
  `errorCode` — a machine-readable i18n key (e.g. `"Granit:Settings:NotFound"`)
  resolvable via the host's localization endpoint.
- **Encrypted values never round-trip.** When `AdminAppSettingResponse.isEncrypted`
  is `true`, the backend returns the value masked as `"***"`. The admin UI must offer
  a reset-then-rewrite flow rather than treating the masked value as editable.
- **`null` vs. omitted on writes.** In `UpdateSettingValueRequest`, `value: null`
  **clears** the override (re-exposing the inherited value); omitting `value` leaves
  the current value unchanged. The same `null`-clears semantics apply to
  `BulkSettingEntry`.
- **Delete is user-scope only.** `deleteSetting` is typed to `scope: 'user'` by
  design — it resets a per-user override so the tenant/global cascade takes over. To
  clear a `global` or `tenant` setting, call `updateSetting` with `{ value: null }`.
- **`allowedValues` drives the control, labels are localized client-side.** When a
  definition's `allowedValues` is non-null and non-empty, render a dropdown; option
  labels follow the `Setting:{key}:Option:{value}` i18n convention.

## Out of scope

- **React bindings** — TanStack Query hooks, query-key factory, and the
  `SettingsProvider` live in [`@granit/react-settings`](../react-settings). This
  package is headless.
- **Admin rendering** — the app-settings edit page, panel, and i18n bundles live in
  [`@granit/react-ui-settings`](../react-ui-settings).
- **i18n resolution** — these functions return raw `errorCode` keys and raw values;
  mapping them to localized messages is the host/UI layer's job.

## License

Apache-2.0
