/**
 * Comparison operator used by {@link DashboardFilterClause}. Mirrors
 * `Granit.Dashboards.DashboardFilterOperator`.
 *
 * PascalCase wire values per ADR-039 §6.1. Names match the OData /
 * Granit.QueryEngine wire vocabulary (`eq`, `ne`, `gt`, `gte`, `lt`,
 * `lte`, `in`, `contains`, `startswith`) so frontend code can reuse the
 * same operator dictionary already used for grid query strings.
 */
export type DashboardFilterOperator =
  | 'Eq'
  | 'Ne'
  | 'Gt'
  | 'Gte'
  | 'Lt'
  | 'Lte'
  | 'In'
  | 'Contains'
  | 'StartsWith';

/**
 * How a {@link DashboardFilter}'s clauses combine. Mirrors
 * `Granit.Dashboards.DashboardFilterOperation`.
 */
export type DashboardFilterOperation = 'And' | 'Or';

/**
 * Single clause inside a {@link DashboardFilter}. Mirrors
 * `Granit.Dashboards.DashboardFilterClause`.
 */
export interface DashboardFilterClause {
  /** Field path (e.g. `"customer.id"`, `"issuedAt"`, `"status"`). */
  readonly field: string;
  /** Comparison operator. */
  readonly op: DashboardFilterOperator;
  /**
   * Static value (string-encoded for JSON parity with the QueryEngine
   * wire format) or a `${variable}` placeholder resolved at query-build
   * time. `null` is valid for operators that test for absence.
   */
  readonly value: string | null;
}

/**
 * Dashboard-scoped filter applied to data-bound widgets that opt in.
 * Mirrors `Granit.Dashboards.DashboardFilter` (P2.5).
 *
 * Distinct from per-datasource filters a widget may carry internally:
 *
 * - **Per-widget filter**: "this chart only ever shows unpaid
 *   invoices". Lives inside the widget's data source.
 * - **Dashboard filter** (this type): "this whole dashboard is now
 *   scoped to March 2026" / "Customer = X". Shared across many widgets,
 *   optionally user-editable from a toolbar control above the grid.
 *
 * Toolbar-exposed filters (`editable: true`) become user-driven
 * controls. Non-editable filters apply silently — useful for "current
 * user", "current tenant" scoping.
 */
export interface DashboardFilter {
  /**
   * Filter identifier referenced from a data source's
   * `DashboardFilters` list. PascalCase, unique within the dashboard.
   */
  readonly name: string;
  /** Localization key for the toolbar label when `editable` is `true`. */
  readonly labelLocalizationKey: string;
  /** One or more clauses combined by {@link operation}. */
  readonly clauses: readonly DashboardFilterClause[];
  /** How clauses combine. Defaults to `"And"` server-side. */
  readonly operation?: DashboardFilterOperation;
  /**
   * When `true`, the filter is rendered as a toolbar control above the
   * grid. Defaults to `false` — silent application.
   */
  readonly editable?: boolean;
}
