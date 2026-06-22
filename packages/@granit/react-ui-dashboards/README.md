# @granit/react-ui-dashboards

Admin UI for the **Dashboards** module — the dashboard catalogue (list +
lifecycle: import / publish / archive / restore / re-sync), the rich
per-dashboard composer (drag-reorder editor with widget palette + config
drawer) and a demo render page (definition / bundle / multi-view paths).

The **visual** layer for dashboards: it composes the headless
[`@granit/react-dashboards`](../react-dashboards) (data hooks + render surfaces)
and [`@granit/react-dashboard-editor`](../react-dashboard-editor) (editor
primitives) with the foundation UI packages ([`@granit/react-ui`](../react-ui)).
The editor merges the framework, analytics and map widget catalogs.

## Usage

```tsx
import { DashboardListPage, dashboardsTranslationsEn } from '@granit/react-ui-dashboards';

i18n.addResourceBundle('en', 'translation', dashboardsTranslationsEn, true, true);

<Route path="/dashboards/manage" element={<DashboardListPage />} />;
```

## Injection

- **API client** — the data hooks resolve their Axios client + base path from a
  `DashboardsProvider` (`@granit/react-dashboards`) higher in the tree, which in
  turn falls back to a host `GranitClientProvider`. No client is baked in.
- **i18n** — ships its `Dashboards.*` strings (`dashboardsTranslationsEn/Fr`);
  the host registers them. `Common.*` keys are app-global.
- **Routing** — the list page navigates to `/dashboards/manage/:id/edit` and the
  edit/demo pages link back to `/dashboards/manage`; the host owns the routes.
