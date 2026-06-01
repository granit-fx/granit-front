import { useMemo } from 'react';

import { Chart } from './chart';

import type { ChartDimensions } from '@granit/charts';
import type { EChartsOption } from 'echarts';

export interface PieDatum {
  readonly id: string;
  readonly name: string;
  readonly value: number;
  readonly color?: string;
}

export interface PieChartProps extends ChartDimensions {
  readonly data: readonly PieDatum[];
  /**
   * When set (e.g. `0.5`), renders a donut with the inner radius at this
   * fraction of the outer radius. Default `0` produces a solid pie.
   */
  readonly innerRadiusRatio?: number;
  readonly showLegend?: boolean;
  readonly className?: string;
  readonly theme?: string | object;
}

/**
 * Typed pie / donut chart wrapper. Pass `innerRadiusRatio` (0–1) to get a
 * donut — common for Odoo-style "X out of total" KPIs.
 */
export function PieChart({
  data,
  innerRadiusRatio = 0,
  showLegend = true,
  height,
  width,
  className,
  theme,
}: PieChartProps) {
  const options = useMemo<EChartsOption>(() => {
    const outerRadius = '70%';
    const innerRadius = innerRadiusRatio > 0 ? `${Math.round(innerRadiusRatio * 70)}%` : '0%';
    return {
      tooltip: { trigger: 'item' },
      legend: showLegend ? { orient: 'vertical', left: 'left' } : undefined,
      series: [
        {
          type: 'pie',
          radius: [innerRadius, outerRadius],
          data: data.map((d) => ({
            id: d.id,
            name: d.name,
            value: d.value,
            itemStyle: d.color ? { color: d.color } : undefined,
          })),
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.2)' },
          },
        },
      ],
    };
  }, [data, innerRadiusRatio, showLegend]);

  return (
    <Chart options={options} height={height ?? width ?? 320} className={className} theme={theme} />
  );
}
