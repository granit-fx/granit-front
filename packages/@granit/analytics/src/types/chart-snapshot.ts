import type { AggregateFunction } from './aggregation';
import type { ChartType } from './chart-widget';
import type { WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

/**
 * One data point on the chart's category axis. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.ChartBucket`.
 */
export interface ChartBucket {
  /**
   * String-friendly group key (e.g. `'Open'`, `'Paid'`, `'2026-04'`). Null
   * group keys surface as `'(null)'`.
   */
  readonly label: string;
  /**
   * Aggregate value for the bucket. `null` when the aggregation is
   * `'Avg'` / `'Min'` / `'Max'` over a group with no usable values — the
   * frontend renders "—" for that data point. `'Count'` and `'Sum'` always
   * carry a non-null value (zero for empty groups).
   */
  readonly value: number | null;
  /**
   * Series (series-by) key for a multi-series chart — one bucket per
   * (category × series) pair. `null`/absent for a single-series chart. Null
   * series values surface as `'(null)'`.
   */
  readonly series?: string | null;
}

/**
 * One point of a scatter plot. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.ScatterPoint`.
 */
export interface ScatterPoint {
  /** X-axis value (the numeric x column). */
  readonly x: number;
  /** Y-axis value (the numeric y column). */
  readonly y: number;
  /**
   * Series key colouring the point; `null`/absent when no series column was
   * requested. Null series values surface as `'(null)'`.
   */
  readonly series?: string | null;
}

/**
 * Snapshot payload for the `'Chart'` widget kind. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.ChartWidgetSnapshot` (B3-5, ADR-039).
 *
 * Echoes the declarative configuration ({@link chartType}, {@link groupBy},
 * {@link aggregation}, {@link field}) so the frontend renders without
 * re-reading the widget config, and ships one {@link ChartBucket} per group
 * as the data series.
 */
export interface ChartWidgetSnapshot {
  /** Visual hint inherited from the declarative `ChartWidgetDefinition.chartType`. */
  readonly chartType: ChartType;
  /** Group-by field name echoed for the frontend's category-axis label. */
  readonly groupBy: string;
  /** Aggregation applied per bucket — drives the value-axis label. */
  readonly aggregation: AggregateFunction;
  /** Aggregated field; `null` for `'Count'`. */
  readonly field: string | null;
  /**
   * Group-aggregate series. Order is preserved as the underlying group-by
   * produces it.
   */
  readonly buckets: readonly ChartBucket[];
  /**
   * ISO 4217 alpha-3 currency code from the value field's
   * `ColumnBuilder.Currency(...)` declaration; `null` when the field is not
   * monetary or for `'Count'`. All buckets share this currency since they
   * aggregate the same value field. B3-8b — when present, the frontend
   * formats every bucket value with the matching currency symbol + locale.
   */
  readonly currency?: string | null;
  /**
   * Second categorical dimension echoed from the definition. When set, the
   * chart is multi-series — each {@link ChartBucket.series} is a value of this
   * dimension. `null`/absent for a single-series chart.
   */
  readonly seriesBy?: string | null;
  /**
   * Whether a multi-series chart stacks its series (vs grouping them). Only
   * ever `true` for `Bar` / `HorizontalBar` / `Line` / `Area` with a
   * `seriesBy` — the backend zeroes it out for every other chart type.
   */
  readonly stacked?: boolean;
  /**
   * Semantic display-type shared by every bucket (`'Count'`, `'Currency'`,
   * `'Percentage'`, `'Bytes'`, …), or `null`. Drives the shared cell formatter
   * so chart values format like the query grids and pivot. Wire values are the
   * .NET `ValueKind` enum member names verbatim.
   */
  readonly valueKind?: string | null;
  /** Numeric x-axis field echoed for the scatter axis label; `null` unless `Scatter`. */
  readonly xField?: string | null;
  /** Numeric y-axis field echoed for the scatter axis label; `null` unless `Scatter`. */
  readonly yField?: string | null;
  /**
   * Scatter point cloud — one point per entity. Populated only for `'Scatter'`;
   * `null`/absent for every other chart type (which ship their series in
   * {@link buckets} instead).
   */
  readonly points?: readonly ScatterPoint[] | null;
}

/** Narrowed `WidgetSnapshotEnvelope` for the `'Chart'` widget kind. */
export type ChartSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Chart', ChartWidgetSnapshot>;
