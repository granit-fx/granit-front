import { useMemo } from 'react';

import { Chart } from './chart.js';

import type { ChartDataPoint, ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface SparklineChartProps extends ChartDimensions {
  readonly data: readonly ChartDataPoint[];
  /** Override the line color. Defaults to the theme's first palette entry. */
  readonly color?: string;
  /** Render as area (filled below the line) rather than a plain line. */
  readonly area?: boolean;
  /** Smooth interpolation. Defaults to `true` for sparklines (visual softness). */
  readonly smooth?: boolean;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Inline mini line chart — no axes, no grid, no legend. Suitable for KPI tile
 * trend hints, table cell trends, or dashboard tickers. Defaults to a small
 * fixed height so it slots into list rows without layout surgery.
 */
export function SparklineChart({
  data,
  color,
  area = false,
  smooth = true,
  height = 40,
  className,
  theme,
}: SparklineChartProps) {
  const options = useMemo<EChartsOption>(
    () => ({
      grid: { left: 0, right: 0, top: 0, bottom: 0 },
      xAxis: { type: 'category', show: false, boundaryGap: false },
      yAxis: { type: 'value', show: false },
      tooltip: { trigger: 'axis', axisPointer: { type: 'line' } },
      series: [
        {
          type: 'line',
          // ECharts' option types want mutable arrays; spread to drop readonly.
          data: data.map((p) => [...p]) as (number | string)[][],
          smooth,
          showSymbol: false,
          lineStyle: color ? { color, width: 2 } : { width: 2 },
          itemStyle: color ? { color } : undefined,
          areaStyle: area ? buildAreaStyle(color) : undefined,
        },
      ],
    }),
    [data, color, area, smooth]
  );

  return <Chart options={options} height={height} className={className} theme={theme} />;
}

function buildAreaStyle(color: string | undefined): { color?: string; opacity: number } {
  return color ? { color, opacity: 0.2 } : { opacity: 0.2 };
}
