import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartAxis, ChartDimensions, ChartSeries } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface ScatterChartProps extends ChartDimensions {
  /** One series per colour group; each point is a numeric `[x, y]` pair. */
  readonly series: readonly ChartSeries<number, number>[];
  readonly xAxis?: ChartAxis;
  readonly yAxis?: ChartAxis;
  /** Show the legend above the plot area. Defaults to `true` when >1 series. */
  readonly showLegend?: boolean;
  /** Locale-aware formatter for both value axes + tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed scatter (point cloud) chart wrapper. Both axes are numeric value axes;
 * each {@link ChartSeries} is a colour group (from the widget's series-by
 * dimension). Unlike the aggregating primitives, scatter plots raw points.
 */
export function ScatterChart({
  series,
  xAxis,
  yAxis,
  showLegend,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: ScatterChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const wantLegend = showLegend ?? series.length > 1;
    const axisLabel = valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined;
    return {
      tooltip: {
        trigger: 'item',
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
      xAxis: { type: 'value', name: xAxis?.label, min: xAxis?.min, max: xAxis?.max, axisLabel },
      yAxis: { type: 'value', name: yAxis?.label, min: yAxis?.min, max: yAxis?.max, axisLabel },
      series: series.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'scatter',
        // Spread drops the readonly for ECharts' mutable option types.
        data: s.data.map((p) => [...p]) as number[][],
        itemStyle: s.color ? { color: s.color } : undefined,
      })),
    };
  }, [series, xAxis, yAxis, showLegend, valueFormatter]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
