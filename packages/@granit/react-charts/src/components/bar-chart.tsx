import { useMemo } from 'react';

import { Chart } from './chart.js';

import type { ChartAxis, ChartDimensions, ChartSeries } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface BarChartProps extends ChartDimensions {
  readonly series: readonly ChartSeries[];
  readonly xAxis?: ChartAxis;
  readonly yAxis?: ChartAxis;
  /** Stack series on top of each other. Each stacked series joins the same group. */
  readonly stacked?: boolean;
  /** Render bars horizontally (swaps x and y axis roles). */
  readonly horizontal?: boolean;
  readonly showLegend?: boolean;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed bar chart wrapper. Honors {@link BarChartProps.stacked} for stacked
 * compositions and {@link BarChartProps.horizontal} for category-on-y layouts
 * (useful when category labels are long).
 */
export function BarChart({
  series,
  xAxis,
  yAxis,
  stacked = false,
  horizontal = false,
  showLegend,
  height,
  width,
  className,
  theme,
}: BarChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const wantLegend = showLegend ?? series.length > 1;
    const categoryAxis = {
      type: 'category' as const,
      name: xAxis?.label,
    };
    const valueAxis = {
      type: 'value' as const,
      name: yAxis?.label,
      min: yAxis?.min,
      max: yAxis?.max,
    };
    return {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: wantLegend ? { data: series.map((s) => s.name), top: 0 } : undefined,
      grid: {
        left: 8,
        right: 16,
        top: wantLegend ? 32 : 8,
        bottom: 8,
        containLabel: true,
      },
      xAxis: horizontal ? valueAxis : categoryAxis,
      yAxis: horizontal ? categoryAxis : valueAxis,
      series: series.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'bar',
        // ECharts' option types want mutable arrays; spread to drop readonly.
        data: s.data.map((p) => [...p]) as (number | string)[][],
        stack: stacked ? 'total' : undefined,
        itemStyle: s.color ? { color: s.color } : undefined,
      })),
    };
  }, [series, xAxis, yAxis, stacked, horizontal, showLegend]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
