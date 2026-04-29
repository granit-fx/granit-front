import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ChartSnapshotWidget } from '../snapshot/chart-snapshot-widget.js';

import type { DashboardRenderedWidget } from '@granit/dashboards';

// jsdom doesn't implement Canvas; ECharts queries it on init. Stub the
// echarts-for-react module the same way the typed-primitive tests do —
// we only assert dispatch behaviour, not the rendered Canvas.
vi.mock('echarts-for-react/lib/core', () => ({
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

function chartEnvelope(
  chartType: 'Bar' | 'HorizontalBar' | 'Line' | 'Area' | 'Pie' | 'Donut',
  overrides: Partial<{
    field: string | null;
    currency: string | null;
    aggregation: string;
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
      buckets: [
        { label: '2026-02', value: 12500 },
        { label: '2026-03', value: 18200 },
        { label: '2026-04', value: 21450 },
      ],
      currency: overrides.currency ?? null,
    },
  };
}

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
