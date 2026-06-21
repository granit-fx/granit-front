# @granit/react-ui-auditing

Admin UI for the **Granit.Auditing** module — the audit-log list and detail
pages plus their presentational pieces (columns, category / change-type badges,
entity-change cards).

It is the **visual** layer for auditing: it composes the headless
[`@granit/react-auditing`](../react-auditing) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)). The headless package
stays free of presentation; this package stays free of data-fetching wiring.

## Usage

```tsx
import { AuditListPage, AuditDetailPage, auditingTranslationsEn } from '@granit/react-ui-auditing';

// Register the bundle once (flat keys in the "translation" namespace):
i18n.addResourceBundle('en', 'translation', auditingTranslationsEn, true, true);

// Mount the pages in your router (route prefix is yours):
<Route path="/auditing" element={<AuditListPage />} />
<Route path="/auditing/:id" element={<AuditDetailPage />} />
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree. No client is baked in;
  `basePath` defaults to `/api/v1/auditing` and can be overridden per page.
- **Routes** — `routeBase` (default `/auditing`) is injected into the pages and
  column factory, so the package never hardcodes an app's route prefix.
- **i18n** — the package ships its `Audit.*` strings (`auditingTranslationsEn` /
  `auditingTranslationsFr`); the host registers them. `Common.*` keys are
  app-global.
