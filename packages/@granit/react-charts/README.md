# @granit/react-charts

React chart primitives for Granit — typed `<LineChart>`, `<BarChart>`,
`<PieChart>` and `<SparklineChart>` built on Apache ECharts, plus a `<Chart>`
escape hatch for raw ECharts options.

This is the **React rendering layer** for charts. It binds the
framework-agnostic series/theme contracts from
[`@granit/charts`](../charts) to a single, tree-shaken ECharts instance and
exposes them as typed React components. It holds no data-fetching hooks and no
backend counterpart of its own: the data shapes come from `@granit/charts`, and
the snapshot path consumes definitions produced by the analytics / dashboards
pipeline. The split is:

- [`@granit/charts`](../charts) — framework-agnostic core: series/axis/dimension
  types, the `buildEChartsTheme` token-to-theme builder, tick formatters.
- **`@granit/react-charts`** (this package) — typed React components + the
  ECharts theme hook + the dashboard snapshot widget.
- [`@granit/react-dashboards`](../react-dashboards) /
  [`@granit/react-analytics`](../react-analytics) — the rendering pipeline this
  package plugs into via a snapshot-widget registry. There is no `react-ui`
  admin feature kit for charts.

A deliberate design choice runs through the typed primitives: they cover the
~80% case and stay narrow. Power features (dataZoom, brush, markLine, custom
series compositions) are intentionally *not* surfaced as props — reach for
`<Chart>` with raw `EChartsOption` instead. Every `<Chart>` call site is a
maintenance cost that has to migrate if ECharts is ever swapped, so prefer a
typed primitive wherever one fits.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
installed from a public registry for app consumption. Declare the peers:

- `@granit/charts` — series/axis/dimension types + the theme builder.
- `@granit/analytics` — `ChartWidgetSnapshot` / `isChartSnapshotEnvelope`
  (snapshot widget only).
- `@granit/dashboards` — `DashboardRenderedWidget` (snapshot widget only).
- `@granit/react-dashboards` — `SnapshotWidgetRegistry` (snapshot registry only).
- `echarts` `^6.0.0` and `echarts-for-react` `^3.0.6` — the chart engine and
  its React binding.
- `react` `^19.0.0`.

## Quick start

```tsx
import { LineChart, useEChartsTheme } from '@granit/react-charts';

import type { ChartSeries, ChartThemeTokens } from '@granit/charts';

const lightTokens: ChartThemeTokens = {
  /* Tailwind tokens — see @granit/charts buildEChartsTheme */
};

const series: ChartSeries[] = [
  { id: 'visits', name: 'Visits', data: [['Mon', 120], ['Tue', 200], ['Wed', 150]] },
  { id: 'signups', name: 'Sign-ups', data: [['Mon', 12], ['Tue', 30], ['Wed', 18]] },
];

export function TrafficChart() {
  // Registers granit-light / granit-dark themes and tracks the active one;
  // re-runs when the `.dark` class on <html> toggles (Tailwind convention).
  const theme = useEChartsTheme({ lightTokens });

  return (
    <LineChart
      series={series}
      xAxis={{ label: 'Day' }}
      yAxis={{ label: 'Count' }}
      area
      theme={theme}
    />
  );
}
```

For charts the typed primitives don't cover, drop down to the escape hatch:

```tsx
import { Chart } from '@granit/react-charts';

import type { EChartsOption } from 'echarts';

const options: EChartsOption = {
  /* raw ECharts option — dataZoom, brush, custom series, … */
};

export function AdvancedChart() {
  return <Chart options={options} height={400} />;
}
```

To render `Chart`-kind widgets from a dashboard snapshot, compose the registry
at the app root alongside the framework and analytics registries:

```tsx
import { defaultChartSnapshotWidgetRegistry } from '@granit/react-charts';

// <SnapshotWidgetRegistryProvider registries={[
//   defaultSnapshotWidgetRegistry,           // Markdown / Text / Image
//   defaultAnalyticsSnapshotWidgetRegistry,  // Kpi
//   defaultChartSnapshotWidgetRegistry,      // Chart
// ]}>
```

## Public API

| Symbol                              | Kind      | Purpose                                                                 |
| ----------------------------------- | --------- | ----------------------------------------------------------------------- |
| `LineChart`                         | component | Typed line/area chart over `ChartSeries[]` (`smooth`, `area`, legend)   |
| `LineChartProps`                    | type      | Props for `<LineChart>`                                                 |
| `BarChart`                          | component | Typed bar chart with `stacked` and `horizontal` layouts                 |
| `BarChartProps`                     | type      | Props for `<BarChart>`                                                  |
| `PieChart`                          | component | Typed pie/donut chart (`innerRadiusRatio` → donut)                      |
| `PieChartProps`                     | type      | Props for `<PieChart>`                                                  |
| `PieDatum`                          | type      | One pie slice: `{ id, name, value, color? }`                            |
| `SparklineChart`                    | component | Inline mini line chart — no axes/grid/legend, for KPI tiles/table cells |
| `SparklineChartProps`               | type      | Props for `<SparklineChart>`                                            |
| `Chart`                             | component | Escape hatch — renders raw `EChartsOption`                              |
| `ChartProps`                        | type      | Props for `<Chart>` (`options`, `height`, `theme`, `onChartReady`)      |
| `useEChartsTheme`                   | hook      | Register light/dark themes from Tailwind tokens, return active name     |
| `UseEChartsThemeOptions`            | type      | Options for `useEChartsTheme`                                           |
| `ChartSnapshotWidget`               | component | Renders a `Chart`-kind dashboard snapshot via the right primitive       |
| `defaultChartSnapshotWidgetRegistry`| const     | `{ Chart: ChartSnapshotWidget }` registry for `<RenderedDashboard>`     |

All primitives accept `height` / `width` (from `ChartDimensions`), a
`className`, and a `theme` (a name registered via ECharts'
`registerTheme`, or a theme object). `theme` is typically the value returned by
`useEChartsTheme`.

## Bundle weight

The package imports from `echarts/core` and registers only the chart types and
components its primitives need (line, bar, pie, gauge + grid/tooltip/title/
legend/dataZoom on the canvas renderer) via a single shared
`echarts-instance` module — primitives never import from `echarts/charts` or
`echarts/components` directly. This tree-shakes the rest of ECharts out of
consumer bundles (~70% lighter than pulling the full `echarts` barrel). Apps
that don't ship `Chart` widgets never import `defaultChartSnapshotWidgetRegistry`
and pay zero ECharts weight. Add a chart type to `echarts-instance.ts` (not to a
component) when you ship a new primitive.

## Out of scope / caveats

- **`<Chart>` is a maintenance liability, not a default.** Prefer a typed
  primitive wherever one fits; reserve the escape hatch for compositions the
  primitives don't cover. The typed wrappers stay narrow on purpose (no
  dataZoom/brush/markLine props) — expanding them couples the framework to
  ECharts internals.
- **ECharts 6 API.** `containLabel: true` is deprecated; the primitives use the
  `outerBoundsMode: 'same'` + `outerBoundsContain: 'axisLabel'` equivalent.
  Pass options against the v6 schema when using `<Chart>`.
- **ECharts ESM entry only.** The `<Chart>` wrapper imports
  `echarts-for-react/esm/core`; the CJS `lib/core` path leaks a `{ default }`
  interop shim into Vite's import graph and surfaces at runtime as
  *"Element type is invalid… got: object"*. Do not switch the import path.
- **Snapshot currency formatting is partial.** `ChartSnapshotWidget` carries the
  ISO 4217 code into the value-axis label when `snapshot.currency` is set, but
  per-tick currency formatting is deferred — the value axis stays numeric and
  tooltips show the raw number until the primitives gain a typed formatter slot.
- **No data fetching.** This package renders data it is handed; querying,
  caching and snapshot production live in the dashboards/analytics layer.

## License

Apache-2.0
