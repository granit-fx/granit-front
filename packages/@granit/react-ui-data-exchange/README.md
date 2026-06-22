# @granit/react-ui-data-exchange

Admin UI for the **Data Exchange** module — the import and export history pages
(filterable, paginated job lists), the shared history column factories, a status
badge, the history filter bar and the import-report dialog.

The **visual** layer for data exchange: it composes the headless
[`@granit/react-data-exchange`](../react-data-exchange) (data hooks + providers)
with the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)).

## Usage

```tsx
import {
  ExportListPage,
  ImportListPage,
  dataExchangeTranslationsEn,
} from '@granit/react-ui-data-exchange';

i18n.addResourceBundle('en', 'translation', dataExchangeTranslationsEn, true, true);

<Route path="/data-exchange/export" element={<ExportListPage />} />;
<Route path="/data-exchange/import" element={<ImportListPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree (`useGranitClient`), then handed
  to the headless `ExportProvider` / `ImportProvider`. No client is baked in.
- **i18n** — ships its `DataExchange.*` strings
  (`dataExchangeTranslationsEn/Fr`); the host registers them. `Common.*` keys are
  app-global.
