# @granit/react-localization

React bindings for the Granit **localization** module — i18next bootstrap, locale
persistence, locale- and timezone-aware date formatting, and the TanStack Query hooks
that read application translations and write admin overrides. This is the **React hooks +
providers layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/localization`](../localization) in hooks, adds React-only concerns (i18next
instance, `TimezoneProvider`, date-fns locale loading), and re-exports the
`react-i18next` surface so apps import everything from one place. It holds no admin
rendering — language tables, switchers, and override dialogs live one layer up.

The split is three packages over the same .NET `Granit.Localization` backend (contract:
`contracts/openapi/localization.json`):

- [`@granit/localization`](../localization) — framework-agnostic core: DTOs, the i18next
  factory (`createLocalization`, `applyTranslations`, `resolveInitialLocale`), and Axios
  functions (`getApplicationLocalization`, `setLocalizationOverride`, …).
- `@granit/react-localization` (this package) — React Query hooks, the i18next React
  factory, `TimezoneProvider`, and date formatting hooks.
- [`@granit/react-ui-localization`](../react-ui-localization) — admin UI kit: language
  list/switcher, override grid, and the translation create/edit/delete dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/localization` — core DTOs, i18next factory, and Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into the query/mutation hooks.
- `@granit/utils` — `formatDate` / `formatDateTime` / `formatTimeAgo`, the single source
  of truth `useDateFormatter` delegates to.
- `@granit/storage` — `createStorage`, the `useLocale` persistence backend.
- `@granit/logger` — `createLogger`, used for date-fns load and language-change warnings.
- `@tanstack/react-query` (`^5`), `react` (`^19`), `i18next` (`^26`), and
  `react-i18next` (`^17`).
- `date-fns` (`^4`) and `@date-fns/tz` (`^1`) — date-fns locale data and timezone math.
- `@granit/query-engine` + `@granit/react-query-engine` (**optional**) — only pulled in
  by the `./testing` override-grid metadata fixture.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-localization/testing`
  subpath.

## Quick start

Create the i18next instance once and mount `I18nextProvider`; load the application bundle
at bootstrap and feed it to `applyTranslations`; optionally wrap the tree in
`TimezoneProvider` so date formatting follows the user's preferred zone.

```tsx
import { applyTranslations } from '@granit/localization';
import {
  createReactLocalization,
  I18nextProvider,
  TimezoneProvider,
  useApplicationLocalization,
  useTranslation,
  useLocale,
} from '@granit/react-localization';
import { useGranitClient } from '@granit/react-api-client';

const i18n = createReactLocalization({ defaultLocale: 'fr' });

function Root({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      {/* `value` is the user's IANA timezone; null falls back to the browser zone. */}
      <TimezoneProvider value={null}>{children}</TimezoneProvider>
    </I18nextProvider>
  );
}

function Bootstrap() {
  const client = useGranitClient();
  // Anonymous, server-cached bundle for the active culture; once-at-bootstrap.
  const { data } = useApplicationLocalization({ client, cultureName: 'fr-BE' });
  if (data) applyTranslations(i18n, data.resources);
  return null;
}

function LanguageSwitcher() {
  const { t } = useTranslation();
  // `setLocale` persists to localStorage and calls i18n.changeLanguage; the
  // `onLocaleChange` callback is where you push the choice to a settings API.
  const { locale, setLocale } = useLocale();
  return <button onClick={() => setLocale('en')}>{t('common.save')} — {locale}</button>;
}
```

Date formatting reads the current UI language and the nearest `TimezoneProvider`:

```tsx
import { useDateFormatter } from '@granit/react-localization';

function ModifiedAt({ value }: { value: string }) {
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  return <time title={formatDateTime(value)}>{formatTimeAgo(value)}</time>;
}
```

Admin screens use the override mutations (idempotent + retry-safe; they invalidate the
`['localization', 'overrides']` query family on success):

```tsx
import {
  useSetLocalizationOverride,
  useDeleteLocalizationOverride,
} from '@granit/react-localization';

function OverrideEditor({ client }: { client: AxiosInstance }) {
  const set = useSetLocalizationOverride({ client });
  const remove = useDeleteLocalizationOverride({ client });
  set.mutate({ resourceName: 'Showcase', cultureName: 'fr', key: 'common.save', value: 'Sauvegarder' });
  remove.mutate({ resourceName: 'Showcase', cultureName: 'fr', key: 'common.cancel' });
  return null;
}
```

## Public API

| Symbol                              | Kind      | Purpose                                                                    |
| ----------------------------------- | --------- | -------------------------------------------------------------------------- |
| `createReactLocalization`           | fn        | `createLocalization` + `initReactI18next` → a React-wired `i18n` instance  |
| `useLocale`                         | hook      | Current locale + setter (localStorage persist, `changeLanguage`, callback) |
| `useApplicationLocalization`        | hook      | `GET {basePath}` — culture bundle + languages (anonymous, 1h `staleTime`)  |
| `useSetLocalizationOverride`        | hook      | Upsert an override (`PUT .../overrides/...`); idempotent, retry-safe       |
| `useDeleteLocalizationOverride`     | hook      | Delete an override (`DELETE .../overrides/...`); idempotent, retry-safe    |
| `useDateLocale`                     | hook      | Lazy-load the date-fns `Locale` for an i18n code (en-US until resolved)    |
| `useDateFormatter`                  | hook      | `{ formatDate, formatDateTime, formatTimeAgo }` bound to locale + zone     |
| `TimezoneProvider`                  | provider  | Sets the preferred IANA timezone for date hooks in the subtree             |
| `useTimezone`                       | hook      | Resolved timezone — provider value, else the browser zone                  |
| `useTranslation`                    | hook      | `react-i18next` `useTranslation` + per-call separator bridge (see below)   |
| `Trans`                             | component | Re-export of `react-i18next` `<Trans>` (interpolation/JSX)                 |
| `I18nextProvider`                   | provider  | Re-export of `react-i18next` `<I18nextProvider>`                           |
| `resolveLabel`                      | fn        | Backend display key → label (i18next first, last-segment fallback)         |
| `UseLocaleOptions`                  | type      | `{ onLocaleChange? }` for `useLocale`                                      |
| `UseApplicationLocalizationOptions` | type      | `{ client, basePath?, cultureName?, enabled? }`                            |
| `LocalizationAdminOptions`          | type      | `{ client, basePath? }` for the override mutations                         |
| `SetOverrideVariables`              | type      | `{ resourceName, cultureName, key, value }` mutation input                 |
| `DeleteOverrideVariables`           | type      | `{ resourceName, cultureName, key }` mutation input                        |

`./testing` subpath (requires the optional `msw` peer): `createLocalizationHandlers`
(stateful MSW handlers for the bundle + override CRUD, default base `/api/v1/localization`),
`localizationOverrideQueryMetadata` (the `/overrides/meta` payload), `buildMockLocalization`,
`mockLanguages`, and `mockLocalizationOverrides`.

## Caveats

- **Client persistence is a hint, not the source of truth.** `useLocale` writes the
  locale to `localStorage` and switches the i18next language; persisting the choice to the
  backend (settings API) is the app's job via `onLocaleChange`. Likewise `TimezoneProvider`
  does not read any API — the app feeds it the user's stored timezone.
- **Separator bridge.** The custom `useTranslation` only diverges from `react-i18next`
  when the consumer passes an explicit non-default namespace **and** the app has disabled
  separators globally (`nsSeparator: false` / `keySeparator: false`). In that case it
  injects `keySeparator: '.'` / `nsSeparator: ':'` per call so framework bundles with
  nested keys resolve, without forcing the app to re-enable separators for its flat
  backend bundle. Default-namespace calls are untouched.
- **Idempotency keys are per logical mutation.** The override hooks mint one
  `Idempotency-Key` per `variables` reference and reuse it across TanStack Query retries,
  so a retry after an ambiguous failure replays the original write rather than re-applying
  it. A fresh `mutate()` call gets a new key — do not memoize and reuse a `variables`
  object across distinct submissions.
- **Date locale falls back silently.** `useDateLocale` returns `en-US` until the dynamic
  `date-fns/locale/*` import resolves, and permanently for any code with no loader entry
  or a failed import (warned via `@granit/logger`). The loader map is explicit because
  date-fns' exports map rejects template-string dynamic imports under Vite.

## Out of scope

- **Admin rendering** — language list/switcher, the override grid, and the translation
  create/edit/delete dialogs live in
  [`@granit/react-ui-localization`](../react-ui-localization). This package is headless.
- **DTOs, the i18next factory, and HTTP transport** — owned by
  [`@granit/localization`](../localization) (mirror of `Granit.Localization`); hooks here
  only adapt them to React Query. There is no separate `/languages` route — languages
  ship inside the `GET {basePath}` application bundle.
- **Authentication and tenancy** — this package consumes the already-authenticated,
  tenant-scoped Axios client from `@granit/api-client`.

## License

Apache-2.0
