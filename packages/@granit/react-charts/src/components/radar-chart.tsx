import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface RadarDatum {
  /** Indicator axis name shown around the radar's perimeter. */
  readonly label: string;
  /** Value plotted on this axis. */
  readonly value: number;
}

export interface RadarChartProps extends ChartDimensions {
  readonly data: readonly RadarDatum[];
  /** Series name shown in the tooltip / legend. */
  readonly name?: string;
  /** Show the legend above the plot area. Defaults to `false`. */
  readonly showLegend?: boolean;
  /** Locale-aware formatter for axis values in the tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed radar (spider) chart wrapper. Each datum becomes one indicator axis
 * and the single series traces the values around them.
 *
 * All indicators share one scale — the max across the data — so the axes read
 * as comparable. ECharts' default per-axis auto-max would stretch every point
 * to the perimeter and flatten the shape the chart exists to show.
 */
export function RadarChart({
  data,
  name,
  showLegend = false,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: RadarChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const sharedMax = Math.max(0, ...data.map((d) => d.value));
    return {
      tooltip: {
        trigger: 'item',
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      legend: showLegend && name ? { data: [name], top: 0 } : undefined,
      radar: {
        indicator: data.map((d) => ({ name: d.label, max: sharedMax })),
      },
      series: [
        {
          type: 'radar',
          data: [{ name, value: data.map((d) => d.value) }],
        },
      ],
    };
  }, [data, name, showLegend, valueFormatter]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
