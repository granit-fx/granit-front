# @granit/react-ui-dashboards

Admin **UI kit** for the Granit **Dashboards** module — the dashboard catalogue
(list + lifecycle: import / publish / archive / restore / re-sync), the rich
per-dashboard composer (drag-reorder editor with widget palette + config drawer)
and a demo render page (definition / bundle / multi-view paths).

This is the top **react-ui** layer of the four-package Dashboards split over the
.NET `Granit.Dashboards` backend (contract:
[`contracts/openapi/dashboards.json`](../../../contracts/openapi/dashboards.json)).
It holds no transport and no data hooks of its own — it composes the headless
layers below into ready-to-route pages and shadcn-styled components:

- [`@granit/dashboards`](../dashboards) — framework-agnostic core: DTOs, pure
  helpers (`detectVersionDrift`, `dashboardDetailToDefinition`,
  `diffDashboardWidgets`) and Axios calls.
- [`@granit/react-dashboards`](../react-dashboards) — React Query hooks
  (`useDashboardList`, `useDashboardDetail`, the lifecycle mutations, the
  per-widget CRUD mutations) plus the render surfaces (`Dashboard`,
  `RenderedDashboard`, `DashboardViewSwitcher`) and `DashboardsProvider`.
- [`@granit/react-dashboard-editor`](../react-dashboard-editor) — editor
  primitives (`EditableDashboard`, `WidgetPalette`, `WidgetConfigDrawer`, the
  catalog/registry composers).
- `@granit/react-ui-dashboards` (this package) — the admin pages and badges.

The composer merges three widget catalogs in one pass — the framework default
plus the analytics ([`@granit/react-analytics`](../react-analytics)) and map
([`@granit/react-map`](../react-map)) catalogs — so any host that mounts these
pages gets KPI, chart, table, pivot and map widgets without extra wiring.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (all `workspace:*` inside the monorepo):

- `@granit/dashboards`, `@granit/react-dashboards`,
  `@granit/react-dashboard-editor` — the three headless layers this kit composes.
- `@granit/analytics` and `@granit/react-analytics` — the analytics widget
  catalog + config-form registry merged into the editor.
- `@granit/react-map` — the map widget catalog + config-form registry.
- `@granit/react-ui` — the foundation shadcn components (`Button`, `Spinner`,
  `Dialog`, `AlertDialog`, `toast`).
- `@granit/react-localization` — `useTranslation` for the `Dashboards.*` /
  `Common.*` keys.
- `@granit/logger` — `createLogger`; edit-save failures are logged for
  diagnostics.
- `lucide-react` (`^1.21`) — page/button icons.
- `react` and `react-dom` (`^19`), `react-router-dom` (`^7.18`) — the pages use
  `useNavigate` / `useParams` / `Link`.

The Axios client is **not** a peer here: the data hooks resolve their client and
base path from a `DashboardsProvider` ([`@granit/react-dashboards`](../react-dashboards))
higher in the tree, which itself falls back to a host `GranitClientProvider`. No
client is baked in.

## Quick start

Register the i18n bundles once, mount a `DashboardsProvider` above the routes,
then drop the pages in. The list page navigates to
`/dashboards/manage/:id/edit`; the edit and demo pages link back to
`/dashboards/manage` — the host owns those route paths.

```tsx
import { DashboardsProvider } from '@granit/react-dashboards';
import { useGranitClient } from '@granit/react-api-client';
import {
  DashboardListPage,
  DashboardEditPage,
  DashboardPage,
  dashboardsTranslationsEn,
  dashboardsTranslationsFr,
} from '@granit/react-ui-dashboards';
import { Route, Routes } from 'react-router-dom';
import i18n from './i18n';

// `Dashboards.*` keys ship here; `Common.*` keys are app-global.
i18n.addResourceBundle('en', 'translation', dashboardsTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', dashboardsTranslationsFr, true, true);

function DashboardsRoutes() {
  return (
    <DashboardsProvider config={{ client: useGranitClient() }}>
      <Routes>
        <Route path="/dashboards/manage" element={<DashboardListPage />} />
        <Route path="/dashboards/manage/:id/edit" element={<DashboardEditPage />} />
        <Route path="/dashboards/demo" element={<DashboardPage />} />
      </Routes>
    </DashboardsProvider>
  );
}
```

The badges and lifecycle dialog are exported standalone for custom catalogue
layouts:

```tsx
import { StatusBadge, DriftBadge } from '@granit/react-ui-dashboards';
import { detectVersionDrift } from '@granit/dashboards';

const drift = detectVersionDrift(dashboard.sourceDefinitionVersion, catalogVersion);

<>
  <StatusBadge status={dashboard.status} />
  <DriftBadge drift={drift} catalogVersion={catalogVersion ?? null} />
</>;
```

`StatusBadge` colour-codes `Draft` / `Published` / `Archived`; `DriftBadge`
renders nothing on the `aligned` / `ad-hoc` happy paths and only surfaces the
`behind` / `ahead` / `unknown` cases.

## Public API

| Symbol                       | Kind      | Purpose                                                                                |
| ---------------------------- | --------- | -------------------------------------------------------------------------------------- |
| `DashboardListPage`          | component | Catalogue list + status filter, import-from-catalog, drift + lifecycle row actions     |
| `DashboardEditPage`          | component | Per-dashboard composer: `EditableDashboard` + palette/config dialogs, diff-driven save |
| `DashboardPage`              | component | Demo render page — definition / bundle / multi-view of `sampleFinanceDashboard`        |
| `StatusBadge`                | component | `Draft` / `Published` / `Archived` tone-coded badge                                    |
| `DriftBadge`                 | component | Catalogue version-drift badge (null on `aligned` / `ad-hoc`)                           |
| `LifecycleConfirmDialog`     | component | Publish / archive / restore / re-sync confirmation `AlertDialog`                       |
| `DashboardImportFromCatalog` | component | Category filter + catalogue picker + import button                                     |
| `LifecycleAction`            | type      | `'publish' \| 'archive' \| 'restore' \| 'resync'`                                      |
| `PendingLifecycle`           | type      | `{ action: LifecycleAction; dashboard: DashboardSummaryResponse }`                     |
| `sampleFinanceDashboard`     | const     | Demo `DashboardDefinition` fixture (markdown banner + 2 KPI tiles)                     |
| `sampleWelcomeDashboard`     | const     | Demo `DashboardDefinition` fixture (markdown / image / text widgets)                   |
| `dashboardsTranslationsEn`   | const     | English i18next resource bundle (flat keys, `translation` ns)                          |
| `dashboardsTranslationsFr`   | const     | French i18next resource bundle                                                         |
| `DashboardsTranslations`     | type      | `typeof dashboardsTranslationsEn` — the bundle's key shape                             |

## Out of scope / caveats

- **No transport, no hooks.** This package renders; it owns no Axios calls and no
  React Query hooks. DTOs and pure helpers come from
  [`@granit/dashboards`](../dashboards); the data hooks, render surfaces and
  `DashboardsProvider` come from [`@granit/react-dashboards`](../react-dashboards).
  The Axios client must be supplied by a provider in the host tree, never passed
  into these pages directly.
- **The provider is the host's job.** None of the exported pages mount a
  `DashboardsProvider` — wire one (or rely on a host `GranitClientProvider`)
  above the routes or every hook throws.
- **`Common.*` keys are app-global.** The shipped bundles only own the
  `Dashboards.*` namespace; `Common.Publish`, `Common.Archive`, `Common.Save`,
  etc. are expected from the host's global bundle. Buttons fall back to English
  `defaultValue`s when a key is missing.
- **The sample dashboards are demo fixtures, not API data.** `sampleFinanceDashboard`
  and `sampleWelcomeDashboard` are hand-authored `DashboardDefinition`s used by
  `DashboardPage`; they stand in for a future `IDashboardDefinitionRegistry` HTTP
  endpoint and are not fetched. `DashboardPage` inlines the MSW seed id rather than
  importing the test-only `@granit/react-dashboards/testing` barrel into the bundle.
- **`Idempotency` and concurrency are backend concerns.** Lifecycle transitions,
  re-sync replay (overrides carried over by widget slug) and per-widget CRUD are
  enforced server-side by `Granit.Dashboards`; this kit only drives them through
  the headless mutations.

## License

Apache-2.0
