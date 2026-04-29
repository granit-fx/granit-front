import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { BarChart } from '../components/bar-chart.js';
import { LineChart } from '../components/line-chart.js';
import { PieChart } from '../components/pie-chart.js';
import { SparklineChart } from '../components/sparkline-chart.js';

import type { ChartSeries } from '@granit/charts';

// jsdom doesn't implement Canvas; ECharts queries it on init. Stub the call.
vi.mock('echarts-for-react/esm/core', () => ({
  default: ({ option }: { readonly option: unknown }) => (
    <div data-testid="echarts-mock" data-option={JSON.stringify(option)} />
  ),
}));

const sampleSeries: ChartSeries[] = [
  {
    id: 's1',
    name: 'A',
    data: [
      ['Mon', 1],
      ['Tue', 3],
      ['Wed', 2],
    ],
  },
  {
    id: 's2',
    name: 'B',
    data: [
      ['Mon', 2],
      ['Tue', 1],
      ['Wed', 4],
    ],
  },
];

describe('chart primitives', () => {
  it('LineChart passes a line series to the underlying ECharts component', () => {
    const { getByTestId } = render(<LineChart series={sampleSeries} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series).toHaveLength(2);
    expect(opt.series[0].type).toBe('line');
    expect(opt.series[0].id).toBe('s1');
  });

  it('LineChart hides the legend when only one series is provided', () => {
    const { getByTestId } = render(<LineChart series={[sampleSeries[0]!]} />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.legend).toBeUndefined();
  });

  it('BarChart applies the stack identifier when stacked is true', () => {
    const { getByTestId } = render(<BarChart series={sampleSeries} stacked />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].stack).toBe('total');
    expect(opt.series[1].stack).toBe('total');
  });

  it('BarChart swaps axes when horizontal is true', () => {
    const { getByTestId } = render(<BarChart series={sampleSeries} horizontal />);
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.xAxis.type).toBe('value');
    expect(opt.yAxis.type).toBe('category');
  });

  it('PieChart maps innerRadiusRatio to a percentage radius', () => {
    const { getByTestId } = render(
      <PieChart
        data={[
          { id: 'a', name: 'A', value: 1 },
          { id: 'b', name: 'B', value: 2 },
        ]}
        innerRadiusRatio={0.5}
      />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.series[0].radius).toEqual(['35%', '70%']);
  });

  it('SparklineChart hides axes and applies smooth by default', () => {
    const { getByTestId } = render(
      <SparklineChart
        data={[
          ['t1', 1],
          ['t2', 2],
          ['t3', 3],
        ]}
      />
    );
    const opt = JSON.parse(getByTestId('echarts-mock').dataset.option ?? '{}');
    expect(opt.xAxis.show).toBe(false);
    expect(opt.yAxis.show).toBe(false);
    expect(opt.series[0].smooth).toBe(true);
    expect(opt.series[0].showSymbol).toBe(false);
  });
});
