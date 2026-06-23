# @granit/react-analytics

React hooks and widget renderers for **`@granit/analytics`** — the `useMetric`
query hook plus the KPI / Chart / Table / Pivot tile renderers that plug into the
`@granit/dashboards` widget registries. Backed by the .NET `Granit.Analytics`
module (`contracts/openapi/analytics.json`, base path `/api/v1/analytics`).

This is the **React** layer. The framework-agnostic contracts (the
`MetricResponse` envelope, `MetricRequest`, the `*WidgetDefinition` discriminated
union, `evaluateMetric`, the snapshot type guards) live in the core
[`@granit/analytics`](../analytics); this package adds the TanStack Query hook,
the presentational tiles, and the registries that wire those tiles into a
dashboard. There is no `react-ui-analytics` admin kit — analytics widgets surface
through the shared dashboards composer in
[`@granit/react-ui-dashboards`](../react-ui-dashboards), which mounts the
read-mode [`@granit/react-dashboards`](../react-dashboards) renderer and the
[`@granit/react-dashboard-editor`](../react-dashboard-editor) composer.

The package exposes three subpaths:

- `.` — runtime hook, tiles, and the read-mode registries.
- `./editor` — config forms + palette catalog for the dashboard composer
  (imported only by editor-enabled apps; tree-shaken away for read-only
  consumers).
- `./testing` — MSW handlers and metric fixtures for `POST /metrics/{name}`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption. A consumer declares these peers:

- `@granit/analytics` — the contracts (`MetricResponse`, `*WidgetDefinition`,
  `evaluateMetric`, snapshot guards).
- `@granit/api-client` + `@granit/react-api-client` — the shared `AxiosInstance`
  and `useGranitClient()` (CSRF / auth / tenant interceptors).
- `@granit/dashboards` + `@granit/react-dashboards` — widget registry contracts,
  the `<RenderedWidget>` dispatcher, and `useWidgetRender`.
- `@granit/types` — branded `ISODateString` helpers.
- `@tanstack/react-query` (^5), `react` (^19), `react-i18next` (^17),
  `lucide-react` (^1) — runtime UI deps.
- `@granit/react-dashboard-editor` (^optional) — only when importing `./editor`.
- `msw` (^2, optional) — only when importing `./testing`.

## Quick start

Compose the analytics registries into the dashboards providers at the app root,
then render a dashboard. The registries are keyed by the widget `type`
discriminator, so the dispatcher resolves each tile without per-app
registration.

```tsx
import {
  defaultAnalyticsWidgetRegistry,
  defaultAnalyticsSnapshotWidgetRegistry,
} from '@granit/react-analytics';
import {
  WidgetRegistryProvider,
  SnapshotWidgetRegistryProvider,
  defaultWidgetRegistry,
  defaultSnapshotWidgetRegistry,
  composeRegistries,
} from '@granit/react-dashboards';

export function DashboardsRoot({ children }: { children: React.ReactNode }) {
  return (
    <WidgetRegistryProvider
      registry={composeRegistries(defaultWidgetRegistry, defaultAnalyticsWidgetRegistry)}
    >
      <SnapshotWidgetRegistryProvider
        registries={[defaultSnapshotWidgetRegistry, defaultAnalyticsSnapshotWidgetRegistry]}
      >
        {children}
      </SnapshotWidgetRegistryProvider>
    </WidgetRegistryProvider>
  );
}
```

Standalone KPI outside a dashboard — drive the pure presentational tile from the
hook directly (no widget definition needed):

```tsx
import { useMetric, KpiTileView } from '@granit/react-analytics';
import { useTranslation } from 'react-i18next';

function RevenueKpi() {
  const { i18n } = useTranslation();
  const query = useMetric('revenue', {
    period: { token: 'last_30d' },
    compareTo: { token: 'previous_period' },
  });

  return (
    <KpiTileView
      title="Revenue"
      data={query.data}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      locale={i18n.language}
    />
  );
}
```

`useMetric` derives its polling cadence from the response's `refreshHint`
(`Static`/`Dynamic` → no polling, `Realtime` → 5 s) and never retries 4xx. Card
chrome (border, padding, title) is owned by the surrounding `<WidgetCard>` inside
a dashboard; `KpiTileView` renders the body only — wrap it yourself when used
standalone.

## Public API

`.` subpath:

| Symbol                                   | Kind      | Purpose                                                               |
| ---------------------------------------- | --------- | --------------------------------------------------------------------- |
| `useMetric`                              | hook      | Evaluates a metric via `POST /metrics/{name}`; `refreshHint` polling  |
| `UseMetricOptions`                       | type      | `{ enabled?, refetchInterval? }` for `useMetric`                      |
| `KpiTile`                                | component | Smart KPI renderer for `KpiWidgetDefinition`; fetches via `useMetric` |
| `KpiTileView`                            | component | Pure presentational KPI body (value + delta + optional trend slot)    |
| `ChartTile`                              | component | Smart chart renderer; `POST /widgets/chart/render`                    |
| `TableTile`                              | component | Smart table renderer; `POST /widgets/table/render`                    |
| `PivotTile`                              | component | Smart pivot renderer; `POST /widgets/pivot/render`                    |
| `KpiSnapshotTile`                        | component | Bundle-driven KPI (consumes the pre-rendered envelope, no fetch)      |
| `TableSnapshotWidget`                    | component | Bundle-driven table (inline rows, per-column currency)                |
| `PivotSnapshotWidget`                    | component | Bundle-driven pivot (flat cells → row-major matrix client-side)       |
| `defaultAnalyticsWidgetRegistry`         | const     | Definition-path renderers keyed by `kpi`/`chart`/`table`/`pivot`      |
| `defaultAnalyticsSnapshotWidgetRegistry` | const     | Snapshot renderers keyed by `Kpi`/`Table`/`Pivot`                     |
| `formatMetricValue`                      | fn        | Locale-aware value formatter by `ValueKind` (Count/Currency/…)        |
| `formatDeltaRatio`                       | fn        | Signed-percentage delta formatter (e.g. `+3.50%`)                     |
| `FormatMetricValueArgs`                  | type      | Args for `formatMetricValue`                                          |
| `*TileProps` / `*TileViewProps`          | type      | Per-component prop types (`KpiTileProps`, `ChartTileProps`, …)        |

`./editor` subpath (config forms for the composer):

| Symbol                              | Kind      | Purpose                                                          |
| ----------------------------------- | --------- | ---------------------------------------------------------------- |
| `analyticsWidgetCatalog`            | const     | Palette entries (label / icon / default size / factory) per kind |
| `analyticsWidgetConfigFormRegistry` | const     | Pre-composed config-form registry keyed by widget `type`         |
| `KpiConfigForm`                     | component | Config form for `KpiWidgetDefinition`                            |
| `ChartConfigForm`                   | component | Config form for `ChartWidgetDefinition`                          |
| `TableConfigForm`                   | component | Config form for `TableWidgetDefinition`                          |
| `PivotConfigForm`                   | component | Config form for `PivotWidgetDefinition`                          |

`./testing` subpath (MSW fixtures):

| Symbol                    | Kind  | Purpose                                                         |
| ------------------------- | ----- | --------------------------------------------------------------- |
| `createAnalyticsHandlers` | fn    | MSW handlers for `POST /metrics/{name}` (unknown name → noData) |
| `buildMockMetric`         | fn    | Resolve a fixture by name, falling back to a `noData` envelope  |
| `mockMetricResponses`     | const | Built-in sample envelopes (`revenue`, `active-users`, …)        |

## Definition path vs snapshot path

Two render paths share the same presentational layer by construction:

- **Definition path** — the registry receives a `*WidgetDefinition`. KPI fetches
  its metric through `useMetric` (kept stable for standalone admin tiles outside
  a dashboard); Chart / Table / Pivot fetch their own envelope via
  `useWidgetRender` (`POST /widgets/{kind}/render`, backend P3) and dispatch
  through `<RenderedWidget>`.
- **Snapshot path** — the bundle response already carries a pre-rendered
  envelope, so `KpiSnapshotTile` / `TableSnapshotWidget` / `PivotSnapshotWidget`
  render it directly with no fetch. Each guards its envelope via the
  `is*SnapshotEnvelope` type guards from `@granit/analytics` and returns `null`
  on a kind mismatch.

The snapshot registry ships `Kpi` / `Table` / `Pivot` today; `Chart` / `Map`
land as their production renderers are wired.

## Caveats

- **Hardcoded period (v1).** `KpiTile` uses a fixed `last_30d / previous_period`
  request; the runtime `DashboardTimeWindow` will replace it once the dashboard
  context propagates a time window. Standalone callers pass their own
  `MetricRequest` to `useMetric`.
- **Datasource coverage.** `KpiTile` only handles a `MetricDatasource`; other
  datasource kinds (query-aggregate, telemetry) render an "unsupported" tile
  until their evaluators ship. A malformed/undefined datasource degrades to the
  same unsupported tile rather than throwing.
- **Server is the source of truth.** Values, `valueKind`, `isFavorable`, trend,
  and currency come from the backend snapshot; the formatters here are purely
  presentational (`Intl`-based) and must never recompute business numbers.
- **Cache-key = subscription identity.** `useMetric`'s key
  (`['analytics', 'metric', name, normalizedRequest]`) is the future push-stream
  subscription identity; `normalizeMetricRequest` canonicalizes the request so
  equivalent inputs collapse to one cache entry. Do not reshape the key.

## License

Apache-2.0
