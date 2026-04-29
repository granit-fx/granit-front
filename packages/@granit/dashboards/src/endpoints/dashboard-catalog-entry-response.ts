import type { DashboardCategory } from '../types/dashboard-category.js';

/**
 * Wire shape of a single entry in `GET /dashboards/catalog`. Mirrors
 * `Granit.Dashboards.Endpoints.Dtos.DashboardCatalogEntryResponse`.
 *
 * Distinct from {@link DashboardSummaryResponse} (the persisted-instance
 * list endpoint): the catalog returns *available definitions* the user
 * can import; the list returns *imported instances* the user already owns.
 */
export interface DashboardCatalogEntryResponse {
  /** Wire identifier — e.g. `"Granit.Invoicing.FinanceOverview"`. */
  readonly name: string;
  readonly category: DashboardCategory;
  /**
   * When `true`, imported instances cannot be deleted by tenant admins
   * (only re-synced).
   */
  readonly isSystem: boolean;
  /** Semver of the definition shape — used by the drift-detection UI. */
  readonly version: string;
  /**
   * Number of widgets shipped by this dashboard (single-view) or by
   * its default view (multi-view).
   */
  readonly widgetCount: number;
  /** Whether the dashboard ships multiple named views (P2.1). */
  readonly hasViews: boolean;
  /** Whether the dashboard takes entity parameters (P2.3). */
  readonly hasAliases: boolean;
  /** Whether the dashboard ships toolbar / silent filters (P2.5). */
  readonly hasFilters: boolean;
}
