# @granit/react-ui-background-jobs

Admin UI for the **Background Jobs** module — the recurring-jobs monitoring page
(a sortable list plus a kanban view of job cards), a status badge, per-job
actions (pause / resume / trigger) and human-readable cron-expression rendering.

The **visual** layer for background jobs: it composes the headless
[`@granit/react-background-jobs`](../react-background-jobs) (data hooks +
provider) with the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)).

## Usage

```tsx
import {
  BackgroundJobListPage,
  backgroundJobsTranslationsEn,
  loadCronstrueLocale,
} from '@granit/react-ui-background-jobs';

i18n.addResourceBundle('en', 'translation', backgroundJobsTranslationsEn, true, true);

// Load the cronstrue locale data on language change (the module is the only
// cronstrue consumer, so it owns the mapping).
i18n.on('languageChanged', (lng) => void loadCronstrueLocale(lng));

<Route path="/background-jobs" element={<BackgroundJobListPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree (`useGranitClient`), then handed
  to the headless `BackgroundJobsProvider`. No client is baked in.
- **i18n** — ships its `BackgroundJobs.*` strings
  (`backgroundJobsTranslationsEn/Fr`); the host registers them. `Common.*` keys
  are app-global.
- **Cron rendering** — `getCronstrueLocale` / `loadCronstrueLocale` map BCP 47
  tags to cronstrue locale files; the host wires `loadCronstrueLocale` to its
  `languageChanged` event.
