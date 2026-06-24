# @granit/react-ui-diagnostics

Admin **UI feature kit** for the Granit **diagnostics** module — the monitoring
page: a responsive grid of service-health cards with status badges and a
self-counting auto-refresh indicator. This is the top **react-ui** layer: it
composes the headless [`@granit/react-diagnostics`](../react-diagnostics)
(`useMonitoringHealth`) with the foundation UI packages
([`@granit/react-ui`](../react-ui)) and renders the screen. It owns no HTTP call
and no query key — those belong to the layers below.

The split is three packages over the same .NET `Granit.Diagnostics` backend
(contract: `contracts/openapi/diagnostics.json`, single route
`GET /diagnostics/health`):

- [`@granit/diagnostics`](../diagnostics) — framework-agnostic core: DTOs
  (`MonitoringHealthResponse`, `ServiceHealthResponse`, `ServiceStatus`), the
  `getMonitoringHealth` Axios call, and `DiagnosticsPermissions`.
- [`@granit/react-diagnostics`](../react-diagnostics) — React Query hook
  (`useMonitoringHealth`) + query-key factory, plus MSW testing fixtures.
- `@granit/react-ui-diagnostics` (this package) — admin UI kit: the
  monitoring/health page, service-health cards, and the auto-refresh indicator.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-diagnostics` — supplies `useMonitoringHealth` (the self-polling
  health query this page renders).
- `@granit/diagnostics` — core DTOs (`ServiceHealthResponse`, `ServiceStatus`)
  the cards type against.
- `@granit/react-api-client` — `useGranitClient`, resolving the Axios client from
  a `GranitClientProvider` higher in the tree.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter` for the
  `Diagnostics.*` strings and the relative "last checked" timestamp.
- `@granit/react-ui` — the foundation primitives (`Card`, `Badge`, `Button`,
  `Skeleton`).
- `@granit/utils` — `cn` class merger.
- `lucide-react` (`^1.21`) — status / refresh icons.
- `react` and `react-dom` (`^19`).

## Quick start

Register the i18n bundle once, then mount the page anywhere below a
`GranitClientProvider` — the page resolves its Axios client itself via
`useGranitClient` and polls every 30 seconds.

```tsx
import { DiagnosticListPage, diagnosticsTranslationsEn } from '@granit/react-ui-diagnostics';

// Merge the Diagnostics.* keys into the host's "translation" namespace.
i18n.addResourceBundle('en', 'translation', diagnosticsTranslationsEn, true, true);

function DiagnosticsRoute() {
  // No props: client comes from <GranitClientProvider>, strings from i18n.
  return <DiagnosticListPage />;
}
```

Drop a single card into a custom layout (e.g. a dashboard tile) by feeding it a
`ServiceHealthResponse` and the report's `checkedAt` timestamp; the card maps
`status` to a colored badge, icon, response time, tags, and an `aria-live`
"unreachable" banner when the service is `down`:

```tsx
import { ServiceHealthCard, AutoRefreshIndicator } from '@granit/react-ui-diagnostics';
import { useMonitoringHealth } from '@granit/react-diagnostics';
import { useGranitClient } from '@granit/react-api-client';

function HealthTile() {
  const client = useGranitClient();
  const { data, isFetching, refetch } = useMonitoringHealth({ client });

  return (
    <div className="space-y-4">
      <AutoRefreshIndicator onRefresh={() => refetch()} isRefreshing={isFetching} />
      {data?.services.map((service) => (
        <ServiceHealthCard key={service.id} service={service} checkedAt={data.checkedAt} />
      ))}
    </div>
  );
}
```

## Public API

| Symbol                      | Kind      | Purpose                                                                  |
| --------------------------- | --------- | ------------------------------------------------------------------------ |
| `DiagnosticListPage`        | component | Full monitoring page: header, auto-refresh, skeleton + card grid         |
| `ServiceHealthCard`         | component | One service card (status badge, response time, tags, down-banner)        |
| `AutoRefreshIndicator`      | component | Refresh button + live 30 s countdown label (`onRefresh`, `isRefreshing`) |
| `diagnosticsTranslationsEn` | const     | English `Diagnostics.*` i18next bundle (flat keys, `translation` ns)     |
| `diagnosticsTranslationsFr` | const     | French `Diagnostics.*` i18next bundle                                    |
| `DiagnosticsTranslations`   | type      | Shape of the bundle (`typeof diagnosticsTranslationsEn`)                 |

`DiagnosticListPage` takes no props. `ServiceHealthCard` takes
`{ service: ServiceHealthResponse, checkedAt: string }`; `AutoRefreshIndicator`
takes `{ onRefresh: () => void, isRefreshing?: boolean }` — the 30 s countdown is
display-only and resets on each `isRefreshing` change, it does not itself trigger
the fetch (the poll is owned by `useMonitoringHealth`).

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree via `useGranitClient`. No
  client is baked in and no provider ships from this package.
- **i18n** — this package ships only its `Diagnostics.*` strings
  (`diagnosticsTranslationsEn` / `diagnosticsTranslationsFr`); the host registers
  them. `Common.*` keys used by the refresh button (`Common.Refresh`) are
  app-global and expected to already be present.

## Out of scope / caveats

- **No data fetching here.** The health query, its 30 s poll, caching, and the
  query-key factory live in [`@granit/react-diagnostics`](../react-diagnostics);
  DTOs and the `getMonitoringHealth` Axios call live in
  [`@granit/diagnostics`](../diagnostics). This package is purely presentational.
- **Read-only surface.** The backend exposes a single `GET .../health` endpoint —
  no mutations, no per-service detail route, no history. The UI reflects that:
  there is nothing to edit.
- **Permission enforcement is the backend's job.** `Diagnostics.Monitoring.Read`
  is re-checked authoritatively by `Granit.Diagnostics` on every request. Gate
  this page's visibility client-side only as a UX hint, never as a security
  boundary.

## License

Apache-2.0
