# @granit/analytics

Framework-agnostic **analytics contracts** for Granit — the TypeScript
counterpart of the .NET `Granit.Analytics` module. It ships the runtime metric
evaluation client plus the KPI / Chart / Table / Pivot / Map widget definitions
and snapshot envelopes consumed by [`@granit/dashboards`](../dashboards).

It holds **no** React, DOM or Node-only dependency — only hand-curated DTOs (kept
in sync with `contracts/openapi/analytics.json` rather than generated from
Orval), a single Axios call, and a set of pure runtime type guards. The React
layer (the `useMetric` hook and the widget renderers registered into the
dashboards widget registry) lives in [`@granit/react-analytics`](../react-analytics);
the admin feature kit lives in [`@granit/react-ui-dashboards`](../react-ui-dashboards).

Two distinct surfaces share this package:

- **Metrics** — single-value KPI evaluation. `evaluateMetric` resolves a backend
  `MetricDefinition` by name over a period (with an optional comparison window)
  and returns a `MetricResponse` envelope.
- **Widgets** — declarative definitions (`AnalyticsWidgetDefinition` and its five
  variants) plus the per-kind snapshot envelopes a dashboard render returns. The
  definitions extend `@granit/dashboards`' `WidgetDefinitionBase`; the envelopes
  narrow its `WidgetSnapshotEnvelope` via the exported type guards.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the Axios instance passed to `evaluateMetric`.
- `@granit/dashboards` — `WidgetDefinitionBase`, `Datasource`, `AggregateFunction`,
  `RefreshHint` and the `WidgetSnapshotEnvelope` base the widget types extend.
- `@granit/types` — the branded `ISODateString` used on metric timestamps.

## Quick start

Evaluate a metric over a rolling 30-day window, comparing against the previous
period:

```ts
import { evaluateMetric } from '@granit/analytics';
import type { MetricRequest } from '@granit/analytics';

const request: MetricRequest = {
  period: { token: 'last_30d' },
  compareTo: { token: 'previous_period' },
};

// `POST {basePath}/metrics/{metricName}` — basePath is the module collection
// root, metricName the registered MetricDefinition.
const response = await evaluateMetric(client, '/api/v1/analytics', 'open-invoices', request);

const { value, valueKind, currency, previous } = response.snapshot;
if (previous?.trend === 'up' && previous.isFavorable) {
  // render a green delta badge
}
```

Refine a heterogeneous dashboard render response, widget by widget, with the
exported type guards:

```ts
import { isKpiSnapshotEnvelope, isChartSnapshotEnvelope } from '@granit/analytics';
import type { WidgetSnapshotEnvelope } from '@granit/dashboards';

function render(envelope: WidgetSnapshotEnvelope) {
  if (isKpiSnapshotEnvelope(envelope)) {
    return renderKpi(envelope.snapshot); // KpiSnapshot
  }
  if (isChartSnapshotEnvelope(envelope)) {
    return renderChart(envelope.snapshot.buckets); // ChartBucket[]
  }
  // …Table / Pivot / Map
}
```

## Public API

### Metrics — runtime evaluation

| Symbol                  | Kind | Purpose                                                      |
| ----------------------- | ---- | ------------------------------------------------------------ |
| `evaluateMetric`        | fn   | `POST {basePath}/metrics/{metricName}` to `MetricResponse`   |
| `MetricRequest`         | type | Request body — `period` + optional `compareTo`              |
| `MetricResponse`        | type | Envelope: `snapshot`, `sequence`, `emittedAt`, `refreshHint` |
| `MetricSnapshotPayload` | type | Value + `valueKind`, `currency`, `previous`, `noData`        |
| `MetricPreviousPayload` | type | Previous-period delta: `value`, `deltaRatio`, `trend`        |
| `PeriodSpec`            | type | `{ token }` or `{ from, to }` calendar window                |
| `PeriodToken`           | type | `'today' \| 'last_30d' \| 'ytd' \| ...` (open `string`)      |
| `CompareSpec`           | type | `{ token }` comparison window                                |
| `CompareToken`          | type | `'previous_period' \| ...` (open `string`)                   |
| `ValueKind`             | type | `'Count' \| 'Number' \| 'Currency' \| ...` wire enum         |
| `Trend`                 | type | `'up' \| 'down' \| 'flat'` (lowercase wire value)            |
| `RefreshHint`           | type | Re-export from `@granit/dashboards` (back-compat)            |

### Widgets — definitions

| Symbol                      | Kind | Purpose                                                     |
| --------------------------- | ---- | ----------------------------------------------------------- |
| `AnalyticsWidgetDefinition` | type | Closed union of the five widget variants below              |
| `KpiWidgetDefinition`       | type | Single-value tile bound via a `Datasource`                  |
| `ChartWidgetDefinition`     | type | Aggregated chart over a `QueryDefinition` (`groupBy` + agg) |
| `TableWidgetDefinition`     | type | Paginated grid over a `QueryDefinition`                     |
| `PivotWidgetDefinition`     | type | Rows by columns by value OLAP pivot                         |
| `MapWidgetDefinition`       | type | Geocoded markers on an interactive map                      |
| `ChartType`                 | type | `'Bar' \| 'Line' \| 'Pie' \| ...` visual hint               |
| `AggregateFunction`         | type | Re-export — `'Count' \| 'Sum' \| 'Avg' \| ...`              |
| `MapPointSource`            | type | `LatLngMapPointSource \| GeographyMapPointSource`           |
| `LatLngMapPointSource`      | type | Decimal lat/lng columns — works on any database             |
| `GeographyMapPointSource`   | type | PostGIS `geography(Point)` column (opt-in, PostGIS-only)    |
| `MapCenter`                 | type | Initial camera center (validated lat/lng range)             |
| `MapTileLayerKind`          | type | `'Plan' \| 'Satellite' \| 'Hybrid' \| ...` default layer    |

### Widgets — snapshot envelopes + guards

| Symbol                      | Kind | Purpose                                                   |
| --------------------------- | ---- | --------------------------------------------------------- |
| `KpiSnapshot`               | type | KPI payload — structural alias of `MetricSnapshotPayload` |
| `KpiSnapshotEnvelope`       | type | `WidgetSnapshotEnvelope` narrowed to `'Kpi'`              |
| `ChartWidgetSnapshot`       | type | Echoed config + `ChartBucket[]` series                    |
| `ChartBucket`               | type | One category-axis data point (`label` + `value`)          |
| `ChartSnapshotEnvelope`     | type | Envelope narrowed to `'Chart'`                            |
| `TableWidgetSnapshot`       | type | `columns` + `rows` + `totalRowCount`                      |
| `TableWidgetColumn`         | type | Column header metadata (name, label key, currency)        |
| `TableSnapshotEnvelope`     | type | Envelope narrowed to `'Table'`                            |
| `PivotWidgetSnapshot`       | type | Echoed config + flat `PivotCell[]` (matrixed client-side) |
| `PivotCell`                 | type | One `(rowKeys` by `columnKeys)` cell                      |
| `PivotSnapshotEnvelope`     | type | Envelope narrowed to `'Pivot'`                            |
| `MapWidgetSnapshot`         | type | `MapPoint[]` markers + camera / clustering hints          |
| `MapPoint`                  | type | One marker (`id`, lat/lng, popup)                         |
| `MapCenterPayload`          | type | Wire shape for the snapshot's `defaultCenter`             |
| `MapSnapshotEnvelope`       | type | Envelope narrowed to `'Map'`                              |
| `isKpiSnapshotEnvelope`     | fn   | Type guard to `KpiSnapshotEnvelope`                       |
| `isChartSnapshotEnvelope`   | fn   | Type guard to `ChartSnapshotEnvelope`                     |
| `isTableSnapshotEnvelope`   | fn   | Type guard to `TableSnapshotEnvelope`                     |
| `isPivotSnapshotEnvelope`   | fn   | Type guard to `PivotSnapshotEnvelope`                     |
| `isMapSnapshotEnvelope`     | fn   | Type guard to `MapSnapshotEnvelope`                       |
| `isLatLngMapPointSource`    | fn   | Narrows `MapPointSource` to lat/lng flavour               |
| `isGeographyMapPointSource` | fn   | Narrows `MapPointSource` to PostGIS geography flavour     |

## Wire-format notes

- **PascalCase enums.** `ValueKind`, `ChartType`, `MapTileLayerKind` and the
  envelope `widgetType` discriminators land verbatim — the backend host
  registers a `JsonStringEnumConverter()` with no naming policy. `Trend` is the
  exception: it ships as a lowercase plain `string` (`'up' \| 'down' \| 'flat'`),
  not an enum.
- **Open token unions.** `PeriodToken` / `CompareToken` are intersected with
  `string & {}` so backend additions (`last_60s`, `mtd`, `qtd`, …) land without
  requiring a client type bump, while editor autocomplete still surfaces the
  known tokens.
- **`required` vs nullability.** Optional keys (`?`) come from the OpenAPI
  `required` array; `T | null` marks a present-but-nullable value. The two axes
  are independent — e.g. `MetricSnapshotPayload.currency` is required-and-nullable
  (`string | null`), present only when `valueKind === 'Currency'`.
- **`RefreshHint` and `AggregateFunction`** are re-exported from
  `@granit/dashboards` (their canonical home per ADR-039), kept here for
  source-level back-compat so analytics consumers need not import both packages.

## Out of scope

- **React.** Hooks (`useMetric`), the query-key factory and the dashboard widget
  renderers live in [`@granit/react-analytics`](../react-analytics). This package
  is intentionally framework-agnostic.
- **Dashboard composition.** `DashboardDefinition`, layout primitives, the
  widget registry and the `WidgetSnapshotEnvelope` base type belong to
  [`@granit/dashboards`](../dashboards); analytics only contributes the five
  analytics widget variants and their snapshot shapes.
- **Map rendering.** `MapWidgetDefinition` is the wire contract only; the Leaflet
  layer resolution and tile providers live in the editor/runtime map packages.
  When overriding `tileUrlTemplate`, hosts MUST keep a visible attribution
  matching the tile provider's licence.
- **Defaults are backend-owned.** Where a definition field is optional
  (`defaultZoom`, `clusterThreshold`, `defaultLayerKind`), the backend supplies
  the effective default at render time; the snapshot envelope echoes the resolved
  value.
