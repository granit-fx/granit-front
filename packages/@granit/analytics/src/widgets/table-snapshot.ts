import type { WidgetSnapshotEnvelope, WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

/**
 * One column header on the wire envelope. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.TableWidgetColumn`.
 */
export interface TableWidgetColumn {
  /**
   * Column property name (camelCase — matches the key in every row payload).
   */
  readonly name: string;
  /**
   * Localization key for the header. `null` when the source `QueryDefinition`
   * declared no localized label — the frontend falls back to {@link name}.
   */
  readonly labelLocalizationKey: string | null;
}

/**
 * Snapshot payload for the `'Table'` widget kind. Mirrors
 * `Granit.Analytics.Endpoints.Rendering.TableWidgetSnapshot` (B3-4, ADR-039).
 *
 * The frontend's table renderer consumes the snapshot directly:
 * {@link columns} drives the header order, {@link rows} carries the body,
 * {@link totalRowCount} drives the "showing N of M" affordance.
 */
export interface TableWidgetSnapshot {
  /**
   * Column metadata in display order. Each entry's {@link TableWidgetColumn.name}
   * matches a key in every row payload.
   */
  readonly columns: readonly TableWidgetColumn[];
  /**
   * Per-row JSON object with camelCase keys and typed JSON primitives.
   * Length is at most the widget's configured page size.
   */
  readonly rows: ReadonlyArray<Readonly<Record<string, unknown>>>;
  /**
   * Total rows in the underlying source after filters apply. May exceed
   * {@link rows} length when the page is full.
   */
  readonly totalRowCount: number;
}

/** Narrowed {@link WidgetSnapshotEnvelope} for the `'Table'` widget kind. */
export type TableSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Table', TableWidgetSnapshot>;

/** Type guard refining a generic envelope to {@link TableSnapshotEnvelope}. */
export function isTableSnapshotEnvelope(
  envelope: WidgetSnapshotEnvelope
): envelope is TableSnapshotEnvelope {
  return envelope.widgetType === 'Table';
}
