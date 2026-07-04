import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface FunnelDatum {
  /** Stage label shown on the segment and in the legend / tooltip. */
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface FunnelChartProps extends ChartDimensions {
  readonly data: readonly FunnelDatum[];
  /** Show the legend beside the plot area. Defaults to `true`. */
  readonly showLegend?: boolean;
  /** Locale-aware formatter for segment values in the tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed funnel chart wrapper. Segments sort descending by value so the widest
 * band sits at the top — the conventional conversion / pipeline reading —
 * regardless of the order the buckets arrive in.
 */
export function FunnelChart({
  data,
  showLegend = true,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: FunnelChartProps) {
  const options = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'item',
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      legend: showLegend ? { orient: 'vertical', left: 'left' } : undefined,
      series: [
        {
          type: 'funnel',
          sort: 'descending',
          data: data.map((d) => ({
            name: d.label,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined,
          })),
        },
      ],
    }),
    [data, showLegend, valueFormatter]
  );

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
