<img src="https://granit-fx.dev/images/granit-icon.svg" alt="" height="32" align="left" style="margin-right:10px" />

# @granit/localization

Framework-agnostic **localization core** — the TypeScript counterpart of the .NET
`Granit.Localization` module. It owns the i18next instance factory, the initial-locale
detection cascade, the translation-merge helpers, and the HTTP client for the localization
endpoints (consumer fetch + admin overrides). It holds **no** React or DOM dependency:
i18next is driven through its plain JS API, and the storage/HTTP/logging concerns are
delegated to injected `@granit/*` infrastructure.

This is the **core** layer of a three-package split:

- **`@granit/localization`** (this package) — i18next factory, locale resolution, DTOs,
  Axios calls, permission constants.
- [`@granit/react-localization`](../react-localization) — React Query hooks, the
  `useLocale` / `useTranslation` / `useDateFormatter` / `useTimezone` surface, and
  `react-i18next` re-exports (`I18nextProvider`, `Trans`).
- [`@granit/react-ui-localization`](../react-ui-localization) — the admin feature kit
  (translation-override management screens).

The backend counterpart is `Granit.Localization`; its wire contract is mirrored in
`contracts/openapi/localization.json`. DTOs here (`ApplicationLocalizationResponse`,
`LanguageInfo`, `LocalizationOverride`) match that snapshot field-for-field, including
audit fields `modifiedAt` / `modifiedBy` (from `AuditedEntity`, not `lastModified*`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not installed from a
public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant, idempotency
  interceptors) passed into every HTTP call.
- `@granit/storage` — backs the locale-persistence read in `resolveInitialLocale`
  (namespaced `dd:` localStorage).
- `@granit/types` — branded id / `ISODateString` primitives used by the override DTOs.
- `@granit/logger` — `createLogger` for the init / language-switch warnings.
- `i18next` (`^26`) — the instance created and mutated by this package.

## Quick start

```ts
import {
  createLocalization,
  resolveInitialLocale,
  getApplicationLocalization,
  applyTranslations,
  LOCALE_STORAGE_KEY,
} from '@granit/localization';
import { apiClient } from '@granit/api-client';

// 1. Create an isolated i18next instance (no global singleton, no `lng` yet).
//    Inject `initReactI18next` via `plugins` when wiring the React layer.
export const i18n = createLocalization();

// 2. Resolve the locale to request BEFORE the first backend fetch.
//    Cascade: dd:locale storage → user setting → navigator.language → default → 'fr'.
const locale = resolveInitialLocale(/* languages */ undefined, LOCALE_STORAGE_KEY);

// 3. Fetch the resource bundle for that culture (anonymous, cached 1h server-side).
const data = await getApplicationLocalization(apiClient, '/api/v1/localization', locale);

// 4. Merge every module bundle into the `translation` namespace and switch language.
applyTranslations(i18n, data);
```

Admin override management (requires the `Localization.Overrides.Manage` permission):

```ts
import {
  setLocalizationOverride,
  deleteLocalizationOverride,
  LocalizationOverridesPermissions,
} from '@granit/localization';
import { apiClient } from '@granit/api-client';

const basePath = '/api/v1/localization';

await setLocalizationOverride(apiClient, basePath, 'Granit', 'fr', 'Auth.Login.Title', 'Connexion');
await deleteLocalizationOverride(apiClient, basePath, 'Granit', 'fr', 'Auth.Login.Title');

LocalizationOverridesPermissions.Overrides.Manage; // 'Localization.Overrides.Manage'
```

## Public API

| Symbol                             | Kind  | Purpose                                                  |
| ---------------------------------- | ----- | -------------------------------------------------------- |
| `createLocalization`               | fn    | Isolated i18next instance with DD defaults + plugins     |
| `resolveInitialLocale`             | fn    | Locale detection cascade (storage, nav, default `'fr'`)  |
| `getApplicationLocalization`       | fn    | `GET {basePath}?cultureName=` resources + languages      |
| `applyTranslations`                | fn    | Merge module bundles into `translation` NS, set language |
| `unflattenKeys`                    | fn    | Dot keys to nested object; `{x}` to i18next `{{x}}`      |
| `setLocalizationOverride`          | fn    | `PUT {basePath}/overrides/.../{key}` (admin write)       |
| `deleteLocalizationOverride`       | fn    | `DELETE {basePath}/overrides/.../{key}` (admin write)    |
| `LOCALE_STORAGE_KEY`               | const | `'locale'` localStorage key (prefixed `dd:`)             |
| `LocalizationOverridesPermissions` | const | `Overrides.Read` / `Overrides.Manage` strings            |
| `LocalizationConfig`               | type  | `createLocalization` options (storageKey, NS, plugins)   |
| `ApplicationLocalizationResponse`  | type  | `GET {basePath}` body (cultureName, resources, langs)    |
| `LanguageInfo`                     | type  | One available language (cultureName, displayName)        |
| `LocalizationOverride`             | type  | Admin override record (audited, multi-tenant)            |
| `LocalizationOverrideId`           | type  | Branded `EntityId<'LocalizationOverride'>`               |
| `ApplicationLocalizationDto`       | type  | **Deprecated** alias of the response type above          |

## Caveats

- **Async resource loading needs store binding.** `createLocalization` sets
  `react.bindI18nStore: 'added removed'`; react-i18next v16 defaults this to `''`, which
  would stop `useTranslation` from re-rendering when `applyTranslations` calls
  `addResourceBundle`. Do not strip this option.
- **No `lng` at init.** The instance is created without an initial language on purpose —
  the locale is decided by `resolveInitialLocale` and applied by `applyTranslations` once
  the backend responds. Read `instance.language` only after the first `applyTranslations`.
- **SmartFormat → i18next placeholders.** Backend bundles use single-brace `{Foo}`;
  `unflattenKeys` rewrites these to `{{Foo}}` and leaves already-doubled braces untouched.
- **Override audit fields.** `LocalizationOverride.modifiedAt` / `modifiedBy` are nullable
  (set on update, `null` on first create); `tenantId === null` denotes a host-level
  override applying to all tenants.
- **`ApplicationLocalizationDto` is deprecated.** It is a backward-compatible alias of
  `ApplicationLocalizationResponse` (renamed to mirror the backend DTO) and will be removed
  in a future major; migrate to the response name.

## Out of scope

- **React hooks, providers, date/timezone formatting, and `react-i18next` re-exports** live
  in [`@granit/react-localization`](../react-localization), not here.
- **Admin override UI** lives in [`@granit/react-ui-localization`](../react-ui-localization).
- **Server-side enforcement.** `LocalizationOverridesPermissions` are UX-gating hints; the
  `Granit.Localization` backend re-checks `Localization.Overrides.Manage` on every write.

## License

Apache-2.0
