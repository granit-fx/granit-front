# @granit/charts

Framework-agnostic **chart primitives** for Granit — typed series shapes, an
ECharts theme builder driven by Tailwind design tokens, and locale-aware tick
formatters.

This is the **core** layer: pure TypeScript with **no** React, DOM or `echarts`
dependency. It deliberately never imports `echarts` — `buildEChartsTheme`
returns a plain JSON object whose shape matches what ECharts consumes, so the
package stays renderer-neutral and testable. The React layer (typed
`<LineChart>` / `<BarChart>` / `<PieChart>` / `<SparklineChart>` components and
the `<Chart>` escape hatch, built on Apache ECharts) lives in
[`@granit/react-charts`](../react-charts), which consumes this package as a
peer.

There is no backend counterpart — charts are a presentation concern. Series
data comes from whatever domain API the host app already queries.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. This
package declares no peer dependencies of its own; it is plain TypeScript with
no runtime dependencies. Consumers that want to render the produced theme do so
through [`@granit/react-charts`](../react-charts) (which carries the `echarts`,
`echarts-for-react` and `react` peers).

## Quick start

```ts
import { buildEChartsTheme, formatAxisTick } from '@granit/charts';
import type { ChartSeries } from '@granit/charts';

// 1. Build an ECharts theme from your app's resolved Tailwind tokens.
//    The returned object is plain JSON — register it with ECharts at the
//    render layer (e.g. echarts.registerTheme('granit-light', theme)).
const theme = buildEChartsTheme({
  background: '#ffffff',
  foreground: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  palette: ['#2563eb', '#16a34a', '#dc2626'],
  fontFamily: 'Inter, sans-serif',
});

// 2. Shape your data as tuple-based series — the native ECharts wire format,
//    so no per-render re-shaping is needed.
const revenue: ChartSeries = {
  id: 'revenue',
  name: 'Revenue',
  data: [
    [Date.UTC(2026, 0, 1), 12450.5],
    [Date.UTC(2026, 1, 1), 13980.0],
  ],
};

// 3. Format axis ticks with Intl-driven, locale-aware grouping/currency.
const tick = formatAxisTick({ kind: 'currency', currency: 'EUR', locale: 'fr-FR' });
tick(12450.5); // → "12 450,50 €"
```

## Public API

| Symbol                 | Kind | Purpose                                                              |
| ---------------------- | ---- | ------------------------------------------------------------------- |
| `ChartDataPoint<X, Y>` | type | Readonly `[x, y]` tuple — the native ECharts point shape            |
| `ChartSeries<X, Y>`    | type | One series: stable `id`, `name`, tuple `data`, optional `color`     |
| `ChartAxis`            | type | Coarse axis config: `type`, `label`, hard `min` / `max`             |
| `ChartDimensions`      | type | Common `height` / `width` props for any chart primitive             |
| `ChartThemeTokens`     | type | Tailwind-aligned token inputs for `buildEChartsTheme`               |
| `buildEChartsTheme`    | fn   | Tokens → frozen ECharts theme JSON (never imports `echarts`)        |
| `FormatAxisTickOptions`| type | Locale, `kind`, `currency`, `maximumFractionDigits` for tick format |
| `formatAxisTick`       | fn   | Returns an `axisLabel.formatter` function via `Intl`                |

### Series shapes

`ChartDataPoint` and `ChartSeries` are generic over the x/y types
(`X = number | string`, `Y = number` by default), so the same shapes carry
time-series, categorical and numeric data. A series `id` is stable across data
updates, letting the renderer preserve color and animation continuity; an
omitted `color` defers to the theme's categorical `palette`.

### Theme builder

`buildEChartsTheme(tokens)` maps a small set of design tokens (`background`,
`foreground`, `muted`, `border`, `palette`, optional `fontFamily`) onto the
ECharts theme structure — `color`, `textStyle`, axis styles for every axis
kind (category / value / time / log), legend, tooltip, grid, and line / bar /
pie defaults. The result is `Object.freeze`d; `fontFamily` falls back to
`'inherit'`.

### Tick formatter

`formatAxisTick(options)` returns a `(value: number | string) => string`
function for ECharts' `axisLabel.formatter`. `kind` selects the `Intl`
formatter: `number` (default, 0 fraction digits), `currency` (requires a
`currency` ISO 4217 code — throws otherwise, 2 digits), `percent` (2 digits),
`time` (`HH:mm`) and `date`. `maximumFractionDigits` overrides the per-kind
default; string inputs are coerced via `Number`.

## Out of scope / caveats

- **No rendering.** This package produces theme objects and formatter
  functions only — it never mounts a chart or imports `echarts`. Rendering,
  ECharts registration and React components live in
  [`@granit/react-charts`](../react-charts).
- **No data fetching.** There are no hooks, query keys or HTTP client here;
  series data is supplied by the host app's existing domain queries.
- **No backend counterpart.** Charts are a presentation concern with no
  `Granit.*` .NET module or OpenAPI contract.
- **Theme shape is not validated against the ECharts version.** The builder
  emits a plain object matching ECharts' documented theme structure; keeping it
  in step with the `echarts` peer pinned in
  [`@granit/react-charts`](../react-charts) is the consumer's responsibility.

## License

Apache-2.0
