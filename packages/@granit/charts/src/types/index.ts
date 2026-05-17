/**
 * Tuple representation of a single chart point — the same shape ECharts and
 * most plotting libraries consume natively. Keeping the wire format aligned
 * with ECharts means our wrappers don't have to re-shape data on every render.
 */
export type ChartDataPoint<X = number | string, Y = number> = readonly [X, Y];

/**
 * One series (line, bar, etc.) of a chart. Series have a stable `id` so the
 * renderer can keep visual continuity (color, animation) when data updates.
 */
export interface ChartSeries<X = number | string, Y = number> {
  /** Stable identifier — drives ECharts series-key matching across re-renders. */
  readonly id: string;
  /** Display name shown in legends and tooltips. */
  readonly name: string;
  readonly data: readonly ChartDataPoint<X, Y>[];
  /**
   * Override color. When omitted, the chart palette assigns a color from the
   * theme's categorical scale.
   */
  readonly color?: string;
}

/**
 * Coarse axis configuration. Concrete chart components extend this with
 * primitive-specific options (e.g. category axes for bar charts).
 */
export interface ChartAxis {
  readonly type?: 'category' | 'time' | 'value' | 'log';
  readonly label?: string;
  /** Hard min — when omitted, ECharts auto-fits. */
  readonly min?: number;
  /** Hard max — when omitted, ECharts auto-fits. */
  readonly max?: number;
}

/** Common dimension props applicable to every chart primitive. */
export interface ChartDimensions {
  readonly height?: number | string;
  readonly width?: number | string;
}
