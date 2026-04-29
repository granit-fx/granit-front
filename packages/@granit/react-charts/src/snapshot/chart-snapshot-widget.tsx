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

  if (chartType === 'Pie' || chartType === 'Donut') {
    const pieData = buckets.map((b) => ({
      id: b.label,
      name: b.label,
      value: b.value ?? 0,
    }));
    return (
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType}>
        <PieChart data={pieData} innerRadiusRatio={chartType === 'Donut' ? 0.5 : 0} />
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
      <div data-slot="chart-snapshot-widget" data-chart-type={chartType}>
        <LineChart
          series={series}
          xAxis={{ label: groupBy }}
          yAxis={{ label: valueAxisLabel }}
          area={chartType === 'Area'}
        />
      </div>
    );
  }

  // 'Bar' or 'HorizontalBar' — the union is exhaustive over ChartType.
  const horizontal = chartType === 'HorizontalBar';
  return (
    <div data-slot="chart-snapshot-widget" data-chart-type={chartType}>
      <BarChart
        series={series}
        xAxis={{ label: horizontal ? valueAxisLabel : groupBy }}
        yAxis={{ label: horizontal ? groupBy : valueAxisLabel }}
        horizontal={horizontal}
      />
    </div>
  );
}
