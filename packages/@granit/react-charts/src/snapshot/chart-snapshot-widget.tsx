import { isChartSnapshotEnvelope } from '@granit/analytics';
import { useLocale } from '@granit/react-localization';
import { useMemo } from 'react';

import { BarChart } from '../components/bar-chart';
import { FunnelChart } from '../components/funnel-chart';
import { HeatmapChart } from '../components/heatmap-chart';
import { LineChart } from '../components/line-chart';
import { PieChart } from '../components/pie-chart';
import { RadarChart } from '../components/radar-chart';
import { ScatterChart } from '../components/scatter-chart';
import { TreemapChart } from '../components/treemap-chart';

import { createChartValueFormatter } from './format-chart-value';

import type { ChartBucket, ChartWidgetSnapshot, ScatterPoint } from '@granit/analytics';
import type { ChartSeries } from '@granit/charts';
import type { DashboardRenderedWidget } from '@granit/dashboards';

/**
 * Reshape the flat bucket list into one {@link ChartSeries} per distinct
 * `series` key — the multi-series transform mirrors the pivot renderer's
 * `(category × series)` pivot. When no bucket carries a `series` key the chart
 * is single-series and collapses to one series named `singleName`.
 *
 * Categories and series keys keep first-seen order (the order the backend
 * streamed them). Sparse `(category × series)` combinations the backend never
 * emitted fill with `0` so grouped/stacked bars keep aligned categories.
 */
function buildChartSeries(
  buckets: readonly ChartBucket[],
  singleName: string
): readonly ChartSeries[] {
  if (!buckets.some((b) => b.series != null)) {
    return [{ id: 'series', name: singleName, data: buckets.map((b) => [b.label, b.value ?? 0]) }];
  }

  const categories: string[] = [];
  const seenCategory = new Set<string>();
  const seriesKeys: string[] = [];
  const seenSeries = new Set<string>();
  const byKey = new Map<string, number>();
  for (const b of buckets) {
    const seriesKey = b.series ?? '(null)';
    if (!seenCategory.has(b.label)) {
      seenCategory.add(b.label);
      categories.push(b.label);
    }
    if (!seenSeries.has(seriesKey)) {
      seenSeries.add(seriesKey);
      seriesKeys.push(seriesKey);
    }
    byKey.set(`${b.label}\u0000${seriesKey}`, b.value ?? 0);
  }

  return seriesKeys.map((seriesKey) => ({
    id: seriesKey,
    name: seriesKey,
    data: categories.map((category) => [category, byKey.get(`${category}\u0000${seriesKey}`) ?? 0]),
  }));
}

/**
 * Group scatter points into one numeric `[x, y]` series per distinct `series`
 * key. When no point carries a `series` key the plot is a single cloud named
 * `singleName`.
 */
function buildScatterSeries(
  points: readonly ScatterPoint[],
  singleName: string
): readonly ChartSeries<number, number>[] {
  if (!points.some((p) => p.series != null)) {
    return [{ id: 'series', name: singleName, data: points.map((p) => [p.x, p.y]) }];
  }

  const seriesKeys: string[] = [];
  const byKey = new Map<string, [number, number][]>();
  for (const p of points) {
    const seriesKey = p.series ?? '(null)';
    let group = byKey.get(seriesKey);
    if (group === undefined) {
      group = [];
      byKey.set(seriesKey, group);
      seriesKeys.push(seriesKey);
    }
    group.push([p.x, p.y]);
  }

  return seriesKeys.map((seriesKey) => ({
    id: seriesKey,
    name: seriesKey,
    data: byKey.get(seriesKey)!,
  }));
}

/**
 * Snapshot-driven renderer for the `'Chart'` widget kind. Mirrors the
 * declarative `<Chart>` definition path: dispatches by `chartType` to the
 * right typed primitive (`<BarChart>` / `<LineChart>` / `<PieChart>`) with
 * the bucket series shaped accordingly.
 *
 * Currency-aware: when `snapshot.currency` is set (B3-8b), the y-axis label
 * carries the ISO 4217 code so consumers can read it at a glance. Per-tick
 * currency formatting is deferred until ECharts options gain a typed
 * formatter slot in the chart primitives — for now the value-axis stays
 * numeric and tooltips show the raw number.
 */
export function ChartSnapshotWidget({ widget }: { readonly widget: DashboardRenderedWidget }) {
  if (!isChartSnapshotEnvelope(widget) || !widget.snapshot) return null;
  return <ChartBody snapshot={widget.snapshot} />;
}

function ChartBody({ snapshot }: { readonly snapshot: ChartWidgetSnapshot }) {
  const { chartType, groupBy, aggregation, field, buckets, currency, seriesBy, stacked } = snapshot;
  const { xField, yField, points } = snapshot;
  const { locale } = useLocale();

  // Locale-aware value formatting for every numeric axis / tooltip. Currency
  // buckets (B3-8b) render with the ISO symbol; everything else uses the
  // culture's grouping + decimals. Memoised so ECharts re-renders only when
  // locale or currency actually changes.
  const valueFormatter = useMemo(
    () => createChartValueFormatter(locale, currency),
    [locale, currency]
  );

  const seriesName = field ? `${aggregation}(${field})` : aggregation;

  // The widget cell is sized by the dashboard grid; charts must fill it
  // rather than render at the typed primitives' default 320px (which
  // overflows tight cells and leaves whitespace in tall ones).
  if (chartType === 'Pie' || chartType === 'Donut') {
    const pieData = buckets.map((b) => ({
      id: b.label,
      name: b.label,
      value: b.value ?? 0,
    }));
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        <PieChart
          data={pieData}
          innerRadiusRatio={chartType === 'Donut' ? 0.5 : 0}
          valueFormatter={valueFormatter}
          height="100%"
        />
      </div>
    );
  }

  // Radar / Funnel / Treemap all consume the same flat label-value list as the
  // pie family — no axis or multi-series shaping — so they share one branch.
  if (chartType === 'Radar' || chartType === 'Funnel' || chartType === 'Treemap') {
    const categoryData = buckets.map((b) => ({ label: b.label, value: b.value ?? 0 }));
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        {chartType === 'Radar' && (
          <RadarChart
            data={categoryData}
            name={seriesName}
            valueFormatter={valueFormatter}
            height="100%"
          />
        )}
        {chartType === 'Funnel' && (
          <FunnelChart data={categoryData} valueFormatter={valueFormatter} height="100%" />
        )}
        {chartType === 'Treemap' && (
          <TreemapChart data={categoryData} valueFormatter={valueFormatter} height="100%" />
        )}
      </div>
    );
  }

  // Scatter is the one non-aggregating type: it plots raw (x, y) points from
  // `snapshot.points` (not `buckets`), one series per series-by colour group.
  if (chartType === 'Scatter') {
    const scatterName = xField && yField ? `${yField} / ${xField}` : seriesName;
    const scatterSeries = buildScatterSeries(points ?? [], scatterName);
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        <ScatterChart
          series={scatterSeries}
          xAxis={{ label: xField ?? '' }}
          yAxis={{ label: yField ?? '' }}
          valueFormatter={valueFormatter}
          height="100%"
        />
      </div>
    );
  }

  // Heatmap needs both axes categorical: category (group-by) × series (series-by)
  // coloured by value. Single-series buckets carry no `series`, so the y-axis
  // collapses to one row named after the aggregation.
  if (chartType === 'Heatmap') {
    const heatmapData = buckets.map((b) => ({
      x: b.label,
      y: b.series ?? seriesName,
      value: b.value ?? 0,
    }));
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        <HeatmapChart
          data={heatmapData}
          xAxis={{ label: groupBy }}
          yAxis={{ label: seriesBy ?? '' }}
          valueFormatter={valueFormatter}
          height="100%"
        />
      </div>
    );
  }

  // Bar / HorizontalBar / Line / Area — single-series when no bucket carries a
  // `series` key, else one series per distinct series-by value (grouped/stacked).
  const series: readonly ChartSeries[] = buildChartSeries(buckets, seriesName);
  const valueAxisLabel = currency ? `${seriesName} (${currency})` : seriesName;

  if (chartType === 'Line' || chartType === 'Area') {
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        <LineChart
          series={series}
          xAxis={{ label: groupBy }}
          yAxis={{ label: valueAxisLabel }}
          area={chartType === 'Area'}
          stacked={stacked ?? false}
          valueFormatter={valueFormatter}
          height="100%"
        />
      </div>
    );
  }

  // 'Bar' or 'HorizontalBar' — the union is exhaustive over ChartType.
  const horizontal = chartType === 'HorizontalBar';
  return (
    <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
      <BarChart
        series={series}
        xAxis={{ label: horizontal ? valueAxisLabel : groupBy }}
        yAxis={{ label: horizontal ? groupBy : valueAxisLabel }}
        horizontal={horizontal}
        stacked={stacked ?? false}
        valueFormatter={valueFormatter}
        height="100%"
      />
    </div>
  );
}
