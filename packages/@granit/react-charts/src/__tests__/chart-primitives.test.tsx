import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BarChart } from '../components/bar-chart';
import { FunnelChart } from '../components/funnel-chart';
import { HeatmapChart } from '../components/heatmap-chart';
import { LineChart } from '../components/line-chart';
import { PieChart } from '../components/pie-chart';
import { RadarChart } from '../components/radar-chart';
import { ScatterChart } from '../components/scatter-chart';
import { SparklineChart } from '../components/sparkline-chart';
import { TreemapChart } from '../components/treemap-chart';

import type { ChartSeries } from '@granit/charts';

// jsdom doesn't implement Canvas; ECharts queries it on init. Stub the
// echarts-for-react module so we can assert the produced option object.
vi.mock('echarts-for-react/esm/core', () => ({
  default: ({ option }: { readonly option: unknown }) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(option)} />
  ),
}));

function optionOf(getByTestId: (id: string) => HTMLElement) {
  return JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
}

const SERIES: readonly ChartSeries[] = [
  { id: 'a', name: 'A', data: [['2026-01', 10] as const, ['2026-02', 20] as const] },
  { id: 'b', name: 'B', data: [['2026-01', 5] as const, ['2026-02', 8] as const] },
];

describe('BarChart', () => {
  it('renders vertical bars with a value y-axis by default', () => {
    const { getByTestId } = render(<BarChart series={SERIES} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('bar');
    expect(opt.xAxis.type).toBe('category');
    expect(opt.yAxis.type).toBe('value');
    // >1 series → legend shown
    expect(opt.legend).not.toBeNull();
  });

  it('stacks series onto a shared group when stacked', () => {
    const { getByTestId } = render(<BarChart series={SERIES} stacked />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].stack).toBe('total');
    expect(opt.series[1].stack).toBe('total');
  });

  it('swaps axis roles when horizontal', () => {
    const { getByTestId } = render(<BarChart series={SERIES} horizontal />);
    const opt = optionOf(getByTestId);
    expect(opt.xAxis.type).toBe('value');
    expect(opt.yAxis.type).toBe('category');
  });

  it('swaps each data pair to [value, category] when horizontal', () => {
    const { getByTestId } = render(<BarChart series={SERIES} horizontal />);
    const opt = optionOf(getByTestId);
    // Authored as ['2026-01', 10]; horizontal must emit [10, '2026-01'] so the
    // number lands on the value (x) axis and the label on the category (y) axis.
    expect(opt.series[0].data[0]).toEqual([10, '2026-01']);
    expect(opt.series[0].data[1]).toEqual([20, '2026-02']);
  });

  it('keeps data pairs as [category, value] when vertical', () => {
    const { getByTestId } = render(<BarChart series={SERIES} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data[0]).toEqual(['2026-01', 10]);
  });
});

describe('PieChart', () => {
  const data = [
    { id: 'x', name: 'X', value: 3 },
    { id: 'y', name: 'Y', value: 7, color: '#abc' },
  ];

  it('renders a solid ring by default', () => {
    const { getByTestId } = render(<PieChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('pie');
    expect(opt.series[0].radius).toEqual(['0%', '70%']);
  });

  it('renders a donut when innerRadiusRatio is set', () => {
    const { getByTestId } = render(<PieChart data={data} innerRadiusRatio={0.5} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].radius).toEqual(['35%', '70%']);
  });

  it('honours a per-datum color override', () => {
    const { getByTestId } = render(<PieChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data[1].itemStyle).toEqual({ color: '#abc' });
  });
});

describe('SparklineChart', () => {
  const data = [['2026-01', 1] as const, ['2026-02', 4] as const, ['2026-03', 2] as const];

  it('renders an axis-less line', () => {
    const { getByTestId } = render(<SparklineChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('line');
    expect(opt.xAxis.show).toBe(false);
    expect(opt.yAxis.show).toBe(false);
  });

  it('fills the area with a translucent color when area + color set', () => {
    const { getByTestId } = render(<SparklineChart data={data} area color="#123456" />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].areaStyle).toEqual({ color: '#123456', opacity: 0.2 });
    expect(opt.series[0].lineStyle).toEqual({ color: '#123456', width: 2 });
  });
});

describe('RadarChart', () => {
  const data = [
    { label: 'Speed', value: 4 },
    { label: 'Range', value: 10 },
    { label: 'Cost', value: 7 },
  ];

  it('maps each datum to one indicator axis', () => {
    const { getByTestId } = render(<RadarChart data={data} name="EV" />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('radar');
    expect(opt.radar.indicator.map((i: { name: string }) => i.name)).toEqual([
      'Speed',
      'Range',
      'Cost',
    ]);
  });

  it('shares one scale across every indicator so the axes stay comparable', () => {
    const { getByTestId } = render(<RadarChart data={data} name="EV" />);
    const opt = optionOf(getByTestId);
    // max = Math.max(4, 10, 7) applied to all axes, not a per-axis auto-max.
    expect(opt.radar.indicator.every((i: { max: number }) => i.max === 10)).toBe(true);
  });

  it('traces the values as a single series', () => {
    const { getByTestId } = render(<RadarChart data={data} name="EV" />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data).toEqual([{ name: 'EV', value: [4, 10, 7] }]);
  });
});

describe('FunnelChart', () => {
  const data = [
    { label: 'Visited', value: 100 },
    { label: 'Signed up', value: 40 },
    { label: 'Paid', value: 12, color: '#0af' },
  ];

  it('renders a descending-sorted funnel', () => {
    const { getByTestId } = render(<FunnelChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('funnel');
    expect(opt.series[0].sort).toBe('descending');
  });

  it('maps labels to segment names and honours a per-datum color', () => {
    const { getByTestId } = render(<FunnelChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data[0]).toMatchObject({ name: 'Visited', value: 100 });
    expect(opt.series[0].data[2].itemStyle).toEqual({ color: '#0af' });
  });
});

describe('LineChart', () => {
  it('stacks the series on a shared baseline when stacked', () => {
    const { getByTestId } = render(<LineChart series={SERIES} stacked />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].stack).toBe('total');
    expect(opt.series[1].stack).toBe('total');
  });

  it('keeps each series independent by default', () => {
    const { getByTestId } = render(<LineChart series={SERIES} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].stack).toBeUndefined();
  });
});

describe('ScatterChart', () => {
  const series: readonly ChartSeries<number, number>[] = [
    { id: 'a', name: 'A', data: [[1, 10] as const, [2, 20] as const] },
    { id: 'b', name: 'B', data: [[3, 5] as const] },
  ];

  it('renders scatter series over two value axes', () => {
    const { getByTestId } = render(<ScatterChart series={series} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('scatter');
    expect(opt.xAxis.type).toBe('value');
    expect(opt.yAxis.type).toBe('value');
    expect(opt.series).toHaveLength(2);
  });

  it('keeps each series numeric [x, y] pairs', () => {
    const { getByTestId } = render(<ScatterChart series={series} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data).toEqual([
      [1, 10],
      [2, 20],
    ]);
  });
});

describe('HeatmapChart', () => {
  const data = [
    { x: 'Mon', y: 'AM', value: 3 },
    { x: 'Mon', y: 'PM', value: 8 },
    { x: 'Tue', y: 'AM', value: 5 },
  ];

  it('renders a heatmap series over two category axes with a visualMap', () => {
    const { getByTestId } = render(<HeatmapChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('heatmap');
    expect(opt.xAxis.type).toBe('category');
    expect(opt.yAxis.type).toBe('category');
    expect(opt.xAxis.data).toEqual(['Mon', 'Tue']);
    expect(opt.yAxis.data).toEqual(['AM', 'PM']);
  });

  it('maps each datum to an [xIndex, yIndex, value] triple', () => {
    const { getByTestId } = render(<HeatmapChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data).toEqual([
      [0, 0, 3],
      [0, 1, 8],
      [1, 0, 5],
    ]);
  });

  it('spans the visualMap over the value range', () => {
    const { getByTestId } = render(<HeatmapChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.visualMap.min).toBe(3);
    expect(opt.visualMap.max).toBe(8);
  });
});

describe('TreemapChart', () => {
  const data = [
    { label: 'Docs', value: 30 },
    { label: 'Media', value: 55, color: '#f80' },
  ];

  it('renders flat, non-interactive leaves', () => {
    const { getByTestId } = render(<TreemapChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].type).toBe('treemap');
    expect(opt.series[0].roam).toBe(false);
    expect(opt.series[0].nodeClick).toBe(false);
    expect(opt.series[0].breadcrumb.show).toBe(false);
  });

  it('maps labels to tile names and honours a per-datum color', () => {
    const { getByTestId } = render(<TreemapChart data={data} />);
    const opt = optionOf(getByTestId);
    expect(opt.series[0].data[0]).toMatchObject({ name: 'Docs', value: 30 });
    expect(opt.series[0].data[1].itemStyle).toEqual({ color: '#f80' });
  });
});
