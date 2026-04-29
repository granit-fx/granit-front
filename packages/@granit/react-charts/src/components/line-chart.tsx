import { useMemo } from 'react';

import { Chart } from './chart.js';

import type { ChartAxis, ChartDimensions, ChartSeries } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface LineChartProps extends ChartDimensions {
  readonly series: readonly ChartSeries[];
  readonly xAxis?: ChartAxis;
  readonly yAxis?: ChartAxis;
  /** Smooth out the line interpolation. Defaults to `false` for fidelity. */
  readonly smooth?: boolean;
  /**
   * Fill the area under each series line. Defaults to `false`. Drives the
   * frontend mapping for the `'Area'` chart type from the dashboard render
   * pipeline.
   */
  readonly area?: boolean;
  /** Show the legend above the plot area. Defaults to `true` when >1 series. */
  readonly showLegend?: boolean;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed line chart wrapper. Accepts a list of {@link ChartSeries} plus axis
 * configuration; everything else (palette, font, grid spacing, tooltip
 * trigger) is inherited from the active ECharts theme.
 *
 * Stays narrow on purpose: power users wanting access to dataZoom, brush,
 * markLine, etc. should drop down to `<Chart>` rather than expanding this
 * surface — the wrapper only covers the 80% case.
 */
export function LineChart({
  series,
  xAxis,
  yAxis,
  smooth = false,
  area = false,
  showLegend,
  height,
  width,
  className,
  theme,
}: LineChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const wantLegend = showLegend ?? series.length > 1;
    return {
      tooltip: { trigger: 'axis' },
      legend: wantLegend ? { data: series.map((s) => s.name), top: 0 } : undefined,
      grid: {
        left: 8,
        right: 16,
        top: wantLegend ? 32 : 8,
        bottom: 8,
        containLabel: true,
      },
      xAxis: {
        type: xAxis?.type ?? 'category',
        name: xAxis?.label,
        min: xAxis?.min,
        max: xAxis?.max,
      },
      yAxis: {
        type: yAxis?.type ?? 'value',
        name: yAxis?.label,
        min: yAxis?.min,
        max: yAxis?.max,
      },
      series: series.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'line',
        // ECharts' option types want mutable arrays; spread to drop readonly.
        data: s.data.map((p) => [...p]) as (number | string)[][],
        smooth,
        areaStyle: area ? {} : undefined,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
      })),
    };
  }, [series, xAxis, yAxis, smooth, area, showLegend]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
