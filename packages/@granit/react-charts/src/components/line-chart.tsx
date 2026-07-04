import { useMemo } from 'react';

import { Chart } from './chart';

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
  /**
   * Stack the series on a shared baseline. Defaults to `false`. Combined with
   * {@link area}, produces a stacked-area chart from the multi-series render
   * pipeline.
   */
  readonly stacked?: boolean;
  /** Show the legend above the plot area. Defaults to `true` when >1 series. */
  readonly showLegend?: boolean;
  /** Locale-aware formatter for the value axis + tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
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
  stacked = false,
  showLegend,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: LineChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const wantLegend = showLegend ?? series.length > 1;
    return {
      tooltip: {
        trigger: 'axis',
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      legend: wantLegend ? { data: series.map((s) => s.name), top: 0 } : undefined,
      grid: {
        left: 8,
        right: 16,
        top: wantLegend ? 32 : 8,
        bottom: 8,
        // ECharts 6 deprecated `containLabel: true`; the equivalent is
        // outerBoundsMode 'same' + outerBoundsContain 'axisLabel'.
        outerBoundsMode: 'same',
        outerBoundsContain: 'axisLabel',
      },
      xAxis: {
        type: xAxis?.type ?? 'category',
        name: xAxis?.label,
        min: xAxis?.min,
        max: xAxis?.max,
      },
      // Cast: a numeric `axisLabel.formatter` only type-checks against a value
      // axis, but `type` is a runtime union here (defaults to 'value' in the
      // snapshot path). The value axis is always numeric where a formatter is set.
      yAxis: {
        type: yAxis?.type ?? 'value',
        name: yAxis?.label,
        min: yAxis?.min,
        max: yAxis?.max,
        axisLabel: valueFormatter ? { formatter: (v: number) => valueFormatter(v) } : undefined,
      } as EChartsOption['yAxis'],
      series: series.map((s) => ({
        id: s.id,
        name: s.name,
        type: 'line',
        // ECharts' option types want mutable arrays; spread to drop readonly.
        data: s.data.map((p) => [...p]) as (number | string)[][],
        smooth,
        stack: stacked ? 'total' : undefined,
        areaStyle: area ? {} : undefined,
        itemStyle: s.color ? { color: s.color } : undefined,
        lineStyle: s.color ? { color: s.color } : undefined,
      })),
    };
  }, [series, xAxis, yAxis, smooth, area, stacked, showLegend, valueFormatter]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
