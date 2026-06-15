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
}

/** Narrowed `WidgetSnapshotEnvelope` for the `'Chart'` widget kind. */
export type ChartSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Chart', ChartWidgetSnapshot>;
