/**
 * Coarse layout configuration applied to a dashboard's widget grid. Mirrors
 * `Granit.Dashboards.DashboardLayout`. Per ADR-038, the layout is intentionally
 * minimal at the declarative level — the persisted Dashboard aggregate (story
 * B2) and the frontend composer (story B5) own the fine-grained layout.
 */
export interface DashboardLayout {
  /** Number of grid columns. Default 12 (standard responsive grid). */
  readonly columns: number;
  /** Row height in CSS pixels. Default 80. */
  readonly rowHeight: number;
}

/** Conventional 12-column responsive grid with 80 px row height. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = Object.freeze({
  columns: 12,
  rowHeight: 80,
});
