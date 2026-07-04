import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartSnapshotWidget } from '../snapshot/chart-snapshot-widget';

import type { DashboardRenderedWidget } from '@granit/dashboards';

// jsdom doesn't implement Canvas; ECharts queries it on init. Stub the
// echarts-for-react module the same way the typed-primitive tests do —
// we only assert dispatch behaviour, not the rendered Canvas.
vi.mock('echarts-for-react/esm/core', () => ({
  default: ({ option }: { readonly option: unknown }) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(option)} />
  ),
}));

const ENVELOPE_BASE = {
  id: '8c6b1e10-0000-0000-0000-000000000001',
  status: 'Snapshot' as const,
  sequence: 1,
  emittedAt: '2026-04-29T12:34:56.789Z',
  refreshHint: 'Dynamic' as const,
  reasonLocalizationKey: null,
};

type TestChartType =
  | 'Bar'
  | 'HorizontalBar'
  | 'Line'
  | 'Area'
  | 'Pie'
  | 'Donut'
  | 'Radar'
  | 'Funnel'
  | 'Treemap'
  | 'Heatmap';

function chartEnvelope(
  chartType: TestChartType,
  overrides: Partial<{
    field: string | null;
    currency: string | null;
    aggregation: string;
    seriesBy: string | null;
    stacked: boolean;
    buckets: readonly { label: string; value: number | null; series?: string | null }[];
  }> = {}
): DashboardRenderedWidget {
  return {
    ...ENVELOPE_BASE,
    widgetType: 'Chart',
    snapshot: {
      chartType,
      groupBy: 'IssuedAtMonth',
      aggregation: overrides.aggregation ?? 'Sum',
      field: 'field' in overrides ? overrides.field! : 'Total',
      buckets: overrides.buckets ?? [
        { label: '2026-02', value: 12500 },
        { label: '2026-03', value: 18200 },
        { label: '2026-04', value: 21450 },
      ],
      currency: overrides.currency ?? null,
      seriesBy: overrides.seriesBy ?? null,
      stacked: overrides.stacked ?? false,
    },
  };
}

// Two categories × two series — the shape a multi-series (grouped/stacked) or
// heatmap chart ships. Sparse: ('2026-03', 'EUR') is intentionally omitted.
const MULTI_SERIES_BUCKETS = [
  { label: '2026-02', value: 100, series: 'EUR' },
  { label: '2026-02', value: 40, series: 'USD' },
  { label: '2026-03', value: 55, series: 'USD' },
] as const;

describe('ChartSnapshotWidget — dispatch by chartType', () => {
  it('routes Bar to BarChart with vertical axes', () => {
    const { container, getByTestId } = render(
      <ChartSnapshotWidget widget={chartEnvelope('Bar')} />
    );
    const slot = container.querySelector('[data-slot="chart-snapshot-widget"]');
    expect(slot?.getAttribute('data-chart-type')).toBe('Bar');
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('bar');
    expect(opt.xAxis.type).toBe('category');
    expect(opt.yAxis.type).toBe('value');
  });

  it('routes HorizontalBar to BarChart with swapped axes', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('HorizontalBar')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.xAxis.type).toBe('value');
    expect(opt.yAxis.type).toBe('category');
  });

  it('routes Line to LineChart', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Line')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('line');
    expect(opt.series[0].areaStyle).toBeUndefined();
  });

  it('routes Area to LineChart with areaStyle filled', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Area')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('line');
    expect(opt.series[0].areaStyle).toEqual({});
  });

  it('routes Pie to PieChart with full ring', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Pie')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('pie');
    expect(opt.series[0].radius).toEqual(['0%', '70%']);
  });

  it('routes Donut to PieChart with hollow centre', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Donut')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('pie');
    expect(opt.series[0].radius).toEqual(['35%', '70%']);
  });

  it('routes Radar to RadarChart, one indicator per bucket', () => {
    const { container, getByTestId } = render(
      <ChartSnapshotWidget widget={chartEnvelope('Radar')} />
    );
    expect(
      container
        .querySelector('[data-slot="chart-snapshot-widget"]')
        ?.getAttribute('data-chart-type')
    ).toBe('Radar');
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('radar');
    expect(opt.radar.indicator).toHaveLength(3);
    expect(opt.series[0].data[0].value).toEqual([12500, 18200, 21450]);
  });

  it('routes Funnel to FunnelChart, descending', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Funnel')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('funnel');
    expect(opt.series[0].sort).toBe('descending');
  });

  it('routes Treemap to TreemapChart, one leaf per bucket', () => {
    const { getByTestId } = render(<ChartSnapshotWidget widget={chartEnvelope('Treemap')} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('treemap');
    expect(opt.series[0].data).toHaveLength(3);
  });

  it('routes Scatter to scatter series built from points, grouped by series key', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Chart',
      snapshot: {
        chartType: 'Scatter',
        groupBy: '',
        aggregation: 'Sum',
        field: null,
        buckets: [],
        xField: 'Amount',
        yField: 'Score',
        points: [
          { x: 10, y: 1, series: 'EUR' },
          { x: 20, y: 2, series: 'USD' },
          { x: 30, y: 3, series: 'EUR' },
        ],
      },
    };
    const { getByTestId } = render(<ChartSnapshotWidget widget={widget} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('scatter');
    expect(opt.series.map((s: { name: string }) => s.name)).toEqual(['EUR', 'USD']);
    // EUR groups both its points as numeric [x, y] pairs.
    expect(opt.series[0].data).toEqual([
      [10, 1],
      [30, 3],
    ]);
    expect(opt.xAxis.name).toBe('Amount');
    expect(opt.yAxis.name).toBe('Score');
  });

  it('builds one series per distinct series-by value for a grouped bar', () => {
    const { getByTestId } = render(
      <ChartSnapshotWidget
        widget={chartEnvelope('Bar', { seriesBy: 'Currency', buckets: MULTI_SERIES_BUCKETS })}
      />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    // Two series (EUR, USD), grouped (no stack), aligned on both categories —
    // the missing ('2026-03','EUR') cell fills with 0.
    expect(opt.series).toHaveLength(2);
    expect(opt.series.map((s: { name: string }) => s.name)).toEqual(['EUR', 'USD']);
    expect(opt.series[0].stack).toBeUndefined();
    expect(opt.series[0].data).toEqual([
      ['2026-02', 100],
      ['2026-03', 0],
    ]);
  });

  it('stacks the series when stacked is set', () => {
    const { getByTestId } = render(
      <ChartSnapshotWidget
        widget={chartEnvelope('Bar', {
          seriesBy: 'Currency',
          stacked: true,
          buckets: MULTI_SERIES_BUCKETS,
        })}
      />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].stack).toBe('total');
    expect(opt.series[1].stack).toBe('total');
  });

  it('routes Heatmap to a heatmap series with a visualMap and category axes', () => {
    const { getByTestId } = render(
      <ChartSnapshotWidget
        widget={chartEnvelope('Heatmap', { seriesBy: 'Currency', buckets: MULTI_SERIES_BUCKETS })}
      />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].type).toBe('heatmap');
    expect(opt.visualMap).toBeDefined();
    expect(opt.xAxis.type).toBe('category');
    expect(opt.yAxis.type).toBe('category');
    // [xIndex, yIndex, value] triples over the distinct category/series axes.
    expect(opt.series[0].data[0]).toEqual([0, 0, 100]);
  });

  it('routes Combo to mixed series, one per measure with its renderAs', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Chart',
      snapshot: {
        chartType: 'Combo',
        groupBy: 'Month',
        aggregation: 'Sum',
        field: null,
        buckets: [
          { label: 'Jan', value: 100, series: 'Sum(Total)' },
          { label: 'Jan', value: 12, series: 'Count' },
          { label: 'Feb', value: 140, series: 'Sum(Total)' },
          { label: 'Feb', value: 15, series: 'Count' },
        ],
        comboSeries: [
          { name: 'Sum(Total)', renderAs: 'Bar' },
          { name: 'Count', renderAs: 'Line' },
        ],
      },
    };
    const { getByTestId } = render(<ChartSnapshotWidget widget={widget} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series.map((s: { name: string }) => s.name)).toEqual(['Sum(Total)', 'Count']);
    expect(opt.series[0].type).toBe('bar');
    expect(opt.series[1].type).toBe('line');
    // Bar measure aligned on both categories in declared order.
    expect(opt.series[0].data).toEqual([
      ['Jan', 100],
      ['Feb', 140],
    ]);
  });

  it('appends the currency code to the value-axis label when set (B3-8b)', () => {
    const { getByTestId } = render(
      <ChartSnapshotWidget widget={chartEnvelope('Bar', { currency: 'EUR' })} />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.yAxis.name).toBe('Sum(Total) (EUR)');
  });

  it('drops the field segment of the series name when aggregation is Count', () => {
    const { getByTestId } = render(
      <ChartSnapshotWidget widget={chartEnvelope('Bar', { field: null, aggregation: 'Count' })} />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].name).toBe('Count');
    expect(opt.yAxis.name).toBe('Count');
  });

  it('returns null on an Unavailable status', () => {
    const widget: DashboardRenderedWidget = {
      ...ENVELOPE_BASE,
      widgetType: 'Chart',
      status: 'Unavailable',
      snapshot: null,
      reasonLocalizationKey: 'Widget:Unavailable',
    };
    const { container } = render(<ChartSnapshotWidget widget={widget} />);
    expect(container.firstChild).toBeNull();
  });
});
