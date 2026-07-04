import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartAxis, ChartDimensions, ChartSeries } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface ComboChartSeries extends ChartSeries {
  /** Draw this measure as bars or as a line, on the shared axes. */
  readonly renderAs: 'bar' | 'line';
}

export interface ComboChartProps extends ChartDimensions {
  /** One series per measure; each carries its own `renderAs`. */
  readonly series: readonly ComboChartSeries[];
  readonly xAxis?: ChartAxis;
  readonly yAxis?: ChartAxis;
  /** Show the legend above the plot area. Defaults to `true` when >1 series. */
  readonly showLegend?: boolean;
  /** Locale-aware formatter for the value axis + tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed combo chart wrapper. Draws several measures on one shared category
 * axis, each as a bar or a line per its {@link ComboChartSeries.renderAs} —
 * ECharts renders mixed series types natively.
 */
export function ComboChart({
  series,
  xAxis,
  yAxis,
  showLegend,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: ComboChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const wantLegend = showLegend ?? series.length > 1;
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      legend: wantLegend ? { data: series.map((s) => s.name), top: 0 } : undefined,
      grid: {
        left: 8,
        right: 16,
        top: wantLegend ? 32 : 8,
        bottom: 8,
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: { type: 'category', name: xAxis?.label },
      yAxis: {
        type: 'value',
        name: yAxis?.label,
        axisLabel: valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined,
      } as EChartsOption['yAxis'],
      series: series.map((s) => ({
        id: s.id,
        name: s.name,
        type: s.renderAs,
        // Spread drops the readonly for ECharts' mutable option types.
        data: s.data.map((p) => [...p]) as (number | string)[][],
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.renderAs === 'line' && s.color ? { color: s.color } : undefined,
      })),
    };
  }, [series, xAxis, yAxis, showLegend, valueFormatter]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
