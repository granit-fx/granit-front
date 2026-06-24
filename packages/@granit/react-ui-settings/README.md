# @granit/react-ui-settings

Admin **UI feature kit** for the Granit **Settings** module — the
application-settings edit page and the dynamic settings panel: one typed control
per `ValueKind` (`Bool` → switch, `Int`/`Double` → numeric input, `Json` →
textarea, `String` → text/password), allowed-value dropdowns, encrypted-secret
masking, dirty-diff bulk save, and per-row save outcomes via toasts.

This is the **react-ui** layer — the only one of the three that renders. It
composes the headless [`@granit/react-settings`](../react-settings) (provider +
TanStack Query hooks) with the foundation components from
[`@granit/react-ui`](../react-ui). The split over the same .NET `Granit.Settings`
backend (contract: `contracts/openapi/settings.json`) is:

- [`@granit/settings`](../settings) — framework-agnostic core: DTOs
  (`AdminAppSettingResponse`, `ValueKind`, `BulkSettingEntry`, …), Axios calls,
  and `SettingsPermissions`.
- [`@granit/react-settings`](../react-settings) — React Query hooks + provider
  (`useAdminAppSettings`, `useBulkUpdateSettings`, `SettingsProvider`).
- `@granit/react-ui-settings` (this package) — the admin pages/panels rendered
  from those hooks.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-settings` — the headless hooks/provider this kit renders.
- `@granit/settings` — core DTOs (`AdminSettingsScope`, `ValueKind`, …) the
  props and field renderer reference.
- `@granit/react-ui` — foundation components (`Card`, `Input`, `Select`,
  `Switch`, `Button`, `Skeleton`, `Label`, `toast`).
- `@granit/react-localization` — the `useTranslation` wrapper for the
  `Config.AppSettings.*`, `Common.*`, and dynamic `Setting:*` keys.
- `react` and `react-dom` (`^19`).

The Axios client is **not** a direct peer here: it resolves from a
`GranitClientProvider` (`@granit/react-api-client`) higher in the host tree, via
the `@granit/react-settings` hooks. No client is baked in.

## Quick start

Register the shipped i18n bundle once, then render the page on a route. The
`scope` prop (`'global'` | `'tenant'`, default `'global'`) selects which settings
collection to read/write, so the package never depends on an app's host/tenant
flag.

```tsx
import { AppSettingsEditPage, settingsTranslationsEn } from '@granit/react-ui-settings';
import i18n from '@granit/react-localization';
import { Route } from 'react-router';

// Merge the package's Config.AppSettings.* strings into the host catalog.
i18n.addResourceBundle('en', 'translation', settingsTranslationsEn, true, true);

// A <GranitClientProvider> (and the @granit/react-settings hooks' query client)
// must already be mounted above these routes.
export const settingsRoutes = (
  <>
    {/* Host app reads/writes the global collection. */}
    <Route path="/settings/config" element={<AppSettingsEditPage scope="global" />} />
    {/* Tenant app overrides the tenant collection. */}
    <Route path="/tenant/settings" element={<AppSettingsEditPage scope="tenant" />} />
  </>
);
```

Drop `AppSettingsPanel` into an existing page (e.g. a tab) when you do not want
the page-level title/subtitle header that `AppSettingsEditPage` wraps it in:

```tsx
import { AppSettingsPanel } from '@granit/react-ui-settings';

function ConfigTab() {
  return <AppSettingsPanel scope="tenant" />;
}
```

The panel fetches via `useAdminAppSettings(scope)`, renders one control per
setting, and on submit diffs the form against the loaded baseline — only changed
keys go to `useBulkUpdateSettings(scope)`. Rows whose `outcome !== 'Updated'` are
surfaced as `toast.error`, the rest as a single success toast.

## Public API

| Symbol                    | Kind      | Purpose                                                                 |
| ------------------------- | --------- | ----------------------------------------------------------------------- |
| `AppSettingsEditPage`     | component | Page: title/subtitle header wrapping `AppSettingsPanel` for a `scope`   |
| `AppSettingsEditPageProps`| type      | `{ scope?: AdminSettingsScope }` (default `'global'`)                   |
| `AppSettingsPanel`        | component | `Card` of typed setting fields + bulk save/reset; encrypted-secret mask |
| `AppSettingsPanelProps`   | type      | `{ scope?: AdminSettingsScope }` (default `'global'`)                   |
| `settingsTranslationsEn`  | const     | English `Config.AppSettings.*` i18next bundle (flat keys, `translation`)|
| `settingsTranslationsFr`  | const     | French `Config.AppSettings.*` i18next bundle                            |
| `SettingsTranslations`    | type      | Shape of the translation bundle (`typeof settingsTranslationsEn`)       |

## i18n

The package ships **only** its own `Config.AppSettings.*` strings via
`settingsTranslationsEn` / `settingsTranslationsFr`; the host registers them (see
Quick start). Two key families are intentionally **not** bundled:

- `Common.*` (`Common.Save`, `Common.Saving`, `Common.Reset`) — app-wide shared
  strings owned by the host catalog.
- Dynamic `Setting:*` keys — per-setting labels, descriptions, and option labels
  (`Setting:{key}`, `Setting:{key}:Description`, `Setting:{key}:Option:{value}`).
  Each falls back to the server-provided `label`/`description`/raw value, so a
  setting with no translation still renders sensibly.

Backend per-row failures use the setting's own `errorCode` as a translation key
when present, falling back to `Config.AppSettings.SaveErrorRow`.

## Encrypted-secret handling

Encrypted settings (`isEncrypted`) are never round-tripped in the clear. The
field shows a masked, read-only `••••••••` placeholder backed by an internal
`__GRANIT_ENCRYPTED_UNCHANGED__` sentinel; the user must explicitly click
**Change** to reveal an empty password input and enter a new value. An unchanged
encrypted field is excluded from the bulk-save diff, so existing secrets are
never resent. This is a UX/transport guard only — the server remains responsible
for storing, encrypting, and authorizing secret values.

## Out of scope

- **DTOs and HTTP transport** — owned by [`@granit/settings`](../settings)
  (mirror of `Granit.Settings`).
- **Hooks, query keys, and provider** — owned by
  [`@granit/react-settings`](../react-settings); this kit only renders them.
- **Authorization** — permission gating uses `SettingsPermissions` from
  [`@granit/settings`](../settings) at the call site; the server is the
  authoritative enforcement point for every read and write.
- **Per-setting label/description copy** — supplied by the backend definitions
  or the host's dynamic `Setting:*` keys, not bundled here.

## License

Apache-2.0
