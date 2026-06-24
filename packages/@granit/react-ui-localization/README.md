# @granit/react-ui-localization

Admin **UI feature kit** for the Granit **Localization** module — a read-only
list of the languages available in the application plus a query-driven
translation-overrides grid (module / culture badges, create / edit / delete
dialogs, and data-exchange import / export). This is the **react-ui** layer: it
renders pages, tables, and dialogs by composing the headless
[`@granit/react-localization`](../react-localization) hooks with the foundation
UI packages. It owns no HTTP transport and no React Query wiring of its own.

The split is three packages over the same .NET `Granit.Localization` backend
(contract: `contracts/openapi/localization.json`):

- [`@granit/localization`](../localization) — framework-agnostic core: i18next
  helpers, DTOs (`LanguageInfo`, `LocalizationOverride`), and localization
  hooks/types.
- [`@granit/react-localization`](../react-localization) — React layer: the
  `useTranslation` / `useLocale` / `useDateFormatter` hooks plus the admin
  mutation hooks (`useSetLocalizationOverride`, `useDeleteLocalizationOverride`)
  this kit calls.
- `@granit/react-ui-localization` (this package) — the admin visual layer:
  pages, the overrides grid, the language list/switcher, and the CRUD dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-localization` — headless hooks this kit composes (`useTranslation`,
  `useLocale`, the override mutation hooks).
- `@granit/localization` — core DTOs (`LanguageInfo`, `LocalizationOverride`).
- `@granit/react-api-client` — `useGranitClient`; the CRUD dialogs resolve the
  Axios client from a `GranitClientProvider` higher in the tree.
- `@granit/query-engine` / `@granit/react-query-engine` — drive the overrides grid
  (`QueryProvider`, `useQueryEndpoint`, smart filters) at `/localization/overrides`.
- `@granit/react-ui` — shadcn/ui primitives (dialogs, badges, selects, toast).
- `@granit/react-ui-kit` — the smart-filter bar, sort/group selectors, and
  `QueryEndpointDataTable`.
- `@granit/react-data-exchange` / `@granit/react-ui-data-exchange` — the
  import/export provider, buttons, and dialogs.
- `@granit/utils` — the `cn` class-name helper.
- `@granit/logger` — `createLogger`; dialog errors are logged, not `console`d.
- `@tanstack/react-table` (`^8.21`) — `ColumnDef` for the override columns.
- `lucide-react` (`^1.21`), `react` (`^19`), and `react-dom` (`^19`).

## Quick start

Register the admin strings, populate `LanguagesContext` from `GET /localization`
in the host, then mount the two pages under your already-wired
`GranitClientProvider`. The overrides page wires its own `QueryProvider` and
`DataExchangeProvider` internally.

```tsx
import {
  LanguageListPage,
  LocalizationOverrideListPage,
  LanguagesContext,
  localizationAdminTranslationsEn,
} from '@granit/react-ui-localization';
import type { LanguageInfo } from '@granit/localization';

// Flat dotted `Localization.*` keys — register with key separators disabled.
i18n.addResourceBundle('en', 'translation', localizationAdminTranslationsEn, true, true);

function LocalizationRoutes({ languages }: { languages: LanguageInfo[] }) {
  // `languages` comes from GET /localization → ApplicationLocalizationResponse.languages.
  return (
    <LanguagesContext.Provider value={languages}>
      <Route path="/localization/languages" element={<LanguageListPage />} />
      <Route path="/localization/overrides" element={<LocalizationOverrideListPage />} />
    </LanguagesContext.Provider>
  );
}
```

`LanguageSwitcher` is a standalone control (it reads `LanguagesContext` and drives
`useLocale().setLocale`); drop it anywhere inside the languages provider, e.g. a
footer or a settings menu. `createLocalizationColumns({ t, onEdit, onDelete })`
builds the `ColumnDef[]` for the grid and is exported for hosts that render their
own table instead of `LocalizationOverrideListPage`.

## Public API

| Symbol                            | Kind      | Purpose                                                                       |
| --------------------------------- | --------- | ----------------------------------------------------------------------------- |
| `LanguageListPage`                | component | Page: heading + the read-only `LanguageList`                                  |
| `LocalizationOverrideListPage`    | component | Page: self-contained overrides grid (own `QueryProvider` + data exchange)     |
| `LanguageList`                    | component | Read-only list of available languages (flag, name, default badge)             |
| `LanguageSwitcher`                | component | Locale `<Select>` bound to `useLocale().setLocale`                            |
| `createLocalizationColumns`       | fn        | Builds the override grid `ColumnDef[]` (module / culture badges, row actions) |
| `TranslationCreateDialog`         | component | Create a new override (`PUT .../overrides/{resource}/{culture}/{key}`)        |
| `TranslationEditDialog`           | component | Edit an existing override's value (same upsert `PUT`, identity locked)        |
| `TranslationDeleteDialog`         | component | Confirm + `DELETE .../overrides/{resource}/{culture}/{key}`                   |
| `LanguagesContext`                | provider  | React context holding `LanguageInfo[]`; populated by the host                 |
| `useLanguages`                    | hook      | Read the available languages from `LanguagesContext`                          |
| `localizationAdminTranslationsEn` | const     | English `Localization.*` admin strings (`translation` namespace)              |
| `localizationAdminTranslationsFr` | const     | French `Localization.*` admin strings                                         |

## Injection

- **API client** — the create / edit / delete dialogs resolve the Axios client via
  `useGranitClient` from a `GranitClientProvider` higher in the tree and pass it to
  the `@granit/react-localization` mutation hooks. No client is baked in.
- **Languages** — `LanguageList`, `LanguageSwitcher`, and `TranslationCreateDialog`
  read the available languages from `LanguagesContext`; the host populates it from
  `GET /localization` (`ApplicationLocalizationResponse.languages`). The context
  defaults to `[]`, and every consumer renders `null` while it is empty.
- **i18n** — the kit ships its `Localization.*` strings
  (`localizationAdminTranslationsEn` / `Fr`); the host registers them. The grid,
  dialogs, and data-exchange buttons also rely on `Common.*` and `DataExchange.*`
  keys owned by their respective foundation packages.

## Out of scope / caveats

- **Read-only languages.** The backend exposes no language enable/disable
  capability, so `LanguageList` is intentionally read-only — there is no add /
  remove / reorder UI, by design.
- **Create vs. edit.** Both dialogs hit the same idempotent upsert
  (`PUT .../overrides/{resourceName}/{cultureName}/{key}`); create leaves all
  identity fields editable, edit locks identity and only changes the value.
- **Error surfacing.** Mutation failures are reported by the host's global
  `MutationCache.onError` toast; the dialogs only log the error via
  `@granit/logger` and keep the dialog open.
- **String namespace.** Admin strings use flat dotted keys
  (`Localization.Title`, …) registered with i18next key separators disabled, and
  are named with the `localizationAdmin` prefix to avoid colliding with the
  headless `@granit/react-localization` exports.
- **Transport & React Query** are owned by
  [`@granit/react-localization`](../react-localization) and the query engine; this
  package adds no HTTP calls of its own.

## License

Apache-2.0
