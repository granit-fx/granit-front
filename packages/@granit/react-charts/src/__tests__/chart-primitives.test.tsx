import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BarChart } from '../components/bar-chart';
import { PieChart } from '../components/pie-chart';
import { SparklineChart } from '../components/sparkline-chart';

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
  const data = [
    ['2026-01', 1] as const,
    ['2026-02', 4] as const,
    ['2026-03', 2] as const,
  ];

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
