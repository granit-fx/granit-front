import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartAxis, ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface HeatmapDatum {
  /** Category-axis (x) key. */
  readonly x: string;
  /** Series-axis (y) key. */
  readonly y: string;
  readonly value: number;
}

export interface HeatmapChartProps extends ChartDimensions {
  readonly data: readonly HeatmapDatum[];
  readonly xAxis?: ChartAxis;
  readonly yAxis?: ChartAxis;
  /** Locale-aware formatter for cell values in the tooltip + legend (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed heatmap wrapper. Each datum colours the cell at (`x`, `y`) by its
 * value through a continuous `visualMap` scale. Both axes are categorical —
 * category order is first-seen in `data`.
 *
 * NOTE: the shared ECharts instance must register `HeatmapChart` AND
 * `VisualMapComponent` (see `echarts-instance.ts`). Without the visual map the
 * cells render colourless and the legend is absent — a silent failure.
 */
export function HeatmapChart({
  data,
  xAxis,
  yAxis,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: HeatmapChartProps) {
  const options = useMemo<EChartsOption>(() => {
    // Distinct axis categories in first-seen order, and each datum mapped to
    // its [xIndex, yIndex, value] triple — the shape ECharts' heatmap series
    // consumes against two category axes.
    const xCategories: string[] = [];
    const yCategories: string[] = [];
    const xIndex = new Map<string, number>();
    const yIndex = new Map<string, number>();
    for (const d of data) {
      if (!xIndex.has(d.x)) {
        xIndex.set(d.x, xCategories.length);
        xCategories.push(d.x);
      }
      if (!yIndex.has(d.y)) {
        yIndex.set(d.y, yCategories.length);
        yCategories.push(d.y);
      }
    }

    const points = data.map((d) => [xIndex.get(d.x)!, yIndex.get(d.y)!, d.value]);
    const values = data.map((d) => d.value);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;

    return {
      tooltip: {
        position: 'top',
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      grid: {
        left: 8,
        right: 16,
        top: 8,
        bottom: 48,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: { type: 'category', data: xCategories, name: xAxis?.label },
      yAxis: { type: 'category', data: yCategories, name: yAxis?.label },
      visualMap: {
        min,
        max,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        formatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      series: [
        {
          type: 'heatmap',
          data: points,
          label: { show: false },
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.3)' },
          },
        },
      ],
    };
  }, [data, xAxis, yAxis, valueFormatter]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
