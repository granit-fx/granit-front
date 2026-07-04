import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface TreemapDatum {
  /** Leaf label shown on the tile and in the tooltip. */
  readonly label: string;
  readonly value: number;
  readonly color?: string;
}

export interface TreemapChartProps extends ChartDimensions {
  readonly data: readonly TreemapDatum[];
  /** Locale-aware formatter for tile values in the tooltip (defaults to raw). */
  readonly valueFormatter?: (value: number) => string;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed treemap wrapper. Each datum is a leaf rectangle sized by its value — a
 * compact way to show proportions across many categories where a pie would
 * crowd. Flat (single level) and non-interactive to match the single-series
 * snapshot contract: no drill-down, roam, or breadcrumb.
 */
export function TreemapChart({
  data,
  valueFormatter,
  height,
  width,
  className,
  theme,
}: TreemapChartProps) {
  const options = useMemo<EChartsOption>(
    () => ({
      tooltip: {
        trigger: 'item',
        valueFormatter: valueFormatter ? (v) => valueFormatter(Number(v)) : undefined,
      },
      series: [
        {
          type: 'treemap',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          data: data.map((d) => ({
            name: d.label,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined,
          })),
        },
      ],
    }),
    [data, valueFormatter]
  );

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
