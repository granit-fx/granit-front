import type { EntityListLayoutManifest } from './layouts.js';

/**
 * Reference to one external declarative primitive (Query / Export / Metric /
 * Dashboard) surfaced by the entity. The full metadata for each primitive
 * stays served by its dedicated endpoint — the manifest only carries the
 * key + URL the renderer uses to address it.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityCollectionReference`.
 */
export interface EntityCollectionReference {
  /** Wire identifier (e.g. `"Granit.Invoicing.InvoiceQuery"`). */
  readonly name: string;
  /** Short CLR type name of the underlying definition — debugging aid. */
  readonly clrTypeName: string;
}

/**
 * Collections facet — the queries / exports / metrics / dashboards the
 * entity surfaces, plus the resolved default `EntityView` per the
 * 5-tier precedence (ADR-049), plus the alternative list-view layouts
 * the renderer's `EntityListViewSwitcher` exposes.
 *
 * Mirrors `Granit.Entities.Endpoints.Dtos.EntityCollectionsSection`.
 */
export interface EntityCollectionsSection {
  /** Query reference (list / kanban), or `null` when no list collection. */
  readonly query: EntityCollectionReference | null;
  /** Export reference (CSV / XLSX), or `null`. */
  readonly export: EntityCollectionReference | null;
  /** Metric KPIs surfaced on the detail header. */
  readonly metrics: readonly EntityCollectionReference[];
  /** Dashboards embedded on the detail header. */
  readonly dashboards: readonly EntityCollectionReference[];
  /** Resolved default `EntityView` id, or `null` when none applies. */
  readonly defaultViewId: string | null;
  /**
   * Alternative list-view layouts (kanban / calendar / …) the entity
   * exposes — drives the `EntityListViewSwitcher` tabs. Empty when the
   * entity ships with the default tabular layout only.
   */
  readonly listLayouts: readonly EntityListLayoutManifest[];
}
