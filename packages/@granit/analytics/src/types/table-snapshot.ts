import type { WidgetSnapshotEnvelopeOf } from '@granit/dashboards';

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
  /**
   * ISO 4217 alpha-3 currency code from the column's
   * `ColumnBuilder.Currency(...)` declaration. When present the frontend
   * formats the column's row values with the matching currency symbol +
   * locale; `null` for non-monetary columns. B3-8b — per-column metadata,
   * so a table mixing AmountEur and AmountUsd surfaces both independently.
   */
  readonly currencyCode?: string | null;
  /**
   * Semantic display-type of the source query column (`Currency`, `Percentage`,
   * `Url`, `Date`, …), or `null`. Drives the shared cell formatter so a
   * dashboard table renders values the same way the query grids do. Wire
   * values are the .NET `ValueKind` enum member names verbatim. Mirrors
   * `ColumnDescriptor.ValueKind`.
   */
  readonly valueKind?: string | null;
  /**
   * Name (camelCase) of the sibling column carrying the per-row ISO 4217 code
   * for a multi-currency table, or `null`. Consulted only when
   * {@link currencyCode} is absent; the code is read from
   * `row[currencyCodeField]` on each row.
   */
  readonly currencyCodeField?: string | null;
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

/** Narrowed `WidgetSnapshotEnvelope` for the `'Table'` widget kind. */
export type TableSnapshotEnvelope = WidgetSnapshotEnvelopeOf<'Table', TableWidgetSnapshot>;
