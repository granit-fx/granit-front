import { isChartSnapshotEnvelope } from '@granit/analytics';

import { BarChart } from '../components/bar-chart.js';
import { LineChart } from '../components/line-chart.js';
import { PieChart } from '../components/pie-chart.js';

import type { ChartWidgetSnapshot } from '@granit/analytics';
import type { ChartSeries } from '@granit/charts';
import type { DashboardRenderedWidget } from '@granit/dashboards';

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
  const { chartType, groupBy, aggregation, field, buckets, currency } = snapshot;

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
        <PieChart data={pieData} innerRadiusRatio={chartType === 'Donut' ? 0.5 : 0} height="100%" />
      </div>
    );
  }

  const series: readonly ChartSeries[] = [
    {
      id: 'series',
      name: seriesName,
      data: buckets.map((b) => [b.label, b.value ?? 0]),
    },
  ];

  const valueAxisLabel = currency ? `${seriesName} (${currency})` : seriesName;

  if (chartType === 'Line' || chartType === 'Area') {
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType} className="h-full w-full">
        <LineChart
          series={series}
          xAxis={{ label: groupBy }}
          yAxis={{ label: valueAxisLabel }}
          area={chartType === 'Area'}
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
        height="100%"
      />
    </div>
  );
}
