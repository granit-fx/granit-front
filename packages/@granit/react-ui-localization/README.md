# @granit/react-ui-localization

Admin UI for the **Localization** module — a read-only list of the languages
available in the application plus the translation-overrides grid (module /
culture badges, create / edit / delete dialogs and data-exchange import/export).

The **visual** layer for localization: it composes the headless
[`@granit/react-localization`](../react-localization) (admin mutation hooks +
`useTranslation` / `useDateFormatter`) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit),
[`@granit/react-ui-data-exchange`](../react-ui-data-exchange)).

## Usage

```tsx
import {
  LanguageListPage,
  LocalizationOverrideListPage,
  LanguagesContext,
  localizationAdminTranslationsEn,
} from '@granit/react-ui-localization';

i18n.addResourceBundle('en', 'translation', localizationAdminTranslationsEn, true, true);

// Populate the languages context from GET /localization in the host:
<LanguagesContext.Provider value={languages}>
  <Route path="/localization/languages" element={<LanguageListPage />} />
  <Route path="/localization/overrides" element={<LocalizationOverrideListPage />} />
</LanguagesContext.Provider>;
```

## Injection

- **API client** — the create / edit / delete dialogs resolve the Axios client
  from a `GranitClientProvider` higher in the tree (`useGranitClient` from
  `@granit/react-api-client`) and pass it to the `@granit/react-localization`
  admin mutation hooks. No client baked in.
- **Languages** — `LanguageListPage` / `TranslationCreateDialog` read the
  available languages from `LanguagesContext` (exported here); the host populates
  it from `GET /localization` (`ApplicationLocalizationResponse.languages`).
- **i18n** — ships its `Localization.*` strings
  (`localizationAdminTranslationsEn/Fr`); the host registers them.
