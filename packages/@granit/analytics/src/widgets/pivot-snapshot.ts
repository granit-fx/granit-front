import type { AggregateFunction } from './aggregation.js';
import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

/**
 * One cell of the pivot matrix. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.PivotCell`.
 */
export interface PivotCell {
  /**
   * Row-axis key tuple — same length and order as
   * {@link PivotWidgetSnapshot.rowFields}. Null property values surface as
   * `'(null)'`.
   */
  readonly rowKeys: readonly string[];
  /**
   * Column-axis key tuple — same length and order as
   * {@link PivotWidgetSnapshot.columnFields}. Empty when no column fields
   * were requested.
   */
  readonly columnKeys: readonly string[];
  /**
   * Aggregate value for the cell. `null` when the aggregation is
   * `'Avg'` / `'Min'` / `'Max'` over a cell with no usable values — the
   * frontend renders "—" for that data point. `'Count'` and `'Sum'` always
   * carry a non-null value (zero for empty cells).
   */
  readonly value: number | null;
}

/**
 * Snapshot payload for the `'Pivot'` widget kind. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.PivotWidgetSnapshot` (B3-6, ADR-039).
 *
 * Echoes the declarative configuration ({@link rowFields}, {@link columnFields},
 * {@link valueField}, {@link aggregation}) so the frontend renders without
 * re-reading the widget config, and ships one {@link PivotCell} per
 * (row-tuple × column-tuple) bucket as a flat list — the renderer pivots
 * into a matrix client-side.
 */
export interface PivotWidgetSnapshot {
  /** Row-axis field names, in the order they were declared on the widget. */
  readonly rowFields: readonly string[];
  /**
   * Column-axis field names, in declared order. Empty when the widget has
   * only row dimensions.
   */
  readonly columnFields: readonly string[];
  /** Aggregated field; `null` for `'Count'`. */
  readonly valueField: string | null;
  /** Aggregation applied per cell — drives the value-axis label client-side. */
  readonly aggregation: AggregateFunction;
  /**
   * Per-cell results. Order is preserved as the underlying stream produces
   * them; the frontend pivots into a row-major matrix.
   */
  readonly cells: readonly PivotCell[];
  /**
   * ISO 4217 alpha-3 currency code from the value field's
   * `ColumnBuilder.Currency(...)` declaration; `null` when the field is not
   * monetary or for `'Count'`. All cells share this currency since they
   * aggregate the same value field. B3-8b.
   */
  readonly currency?: string | null;
}

/** Narrowed {@link WidgetSnapshotEnvelope} for the `'Pivot'` widget kind. */
export type PivotSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Pivot', PivotWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link PivotSnapshotEnvelope}. */
export function isPivotSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is PivotSnapshotEnvelope {
  return envelope.widgetType === 'Pivot';
}
