import type { WidgetSize } from './widget-size';

/**
 * Tailwind / Bootstrap-style viewport breakpoints. Mirrors
 * `Granit.Dashboards.DashboardBreakpoint`. PascalCase wire values per
 * ADR-039 §6.1.
 *
 * The {@link DashboardLayout.breakpoints} map lets a dashboard ship a
 * different layout per breakpoint without forking the widget pool.
 */
export type DashboardBreakpoint = 'Xs' | 'Sm' | 'Md' | 'Lg' | 'Xl';

/**
 * Partial layout — merged onto the base {@link DashboardLayout} when a
 * viewport hits the matching {@link DashboardBreakpoint}. Mirrors
 * `Granit.Dashboards.DashboardLayoutOverride`.
 *
 * Every field is optional so overrides stay scoped to what actually
 * changes per breakpoint. `hiddenWidgets` keeps state intact when the
 * viewport flips back — widgets stay in the pool, only the layout drops
 * them.
 */
export interface DashboardLayoutOverride {
  /** Override the base column count at this breakpoint. */
  readonly columns?: number;
  /** Override the base row height at this breakpoint. */
  readonly rowHeight?: number;
  /** Per-widget size overrides keyed by `WidgetDefinition.slug`. */
  readonly widgetSizes?: Readonly<Record<string, WidgetSize>>;
  /** Override the widget order at this breakpoint. */
  readonly widgetOrder?: readonly string[];
  /** Slugs to hide at this breakpoint. */
  readonly hiddenWidgets?: readonly string[];
}

/**
 * Layout configuration for a dashboard's widget grid. Mirrors
 * `Granit.Dashboards.DashboardLayout`.
 *
 * Carries a base configuration applied at every viewport plus optional
 * per-breakpoint overrides — same model ThingsBoard ships, scaled to one
 * grid (the dual-pane container is deferred to v2 — see ADR-038).
 */
export interface DashboardLayout {
  /** Number of grid columns at the base viewport. Default 12. */
  readonly columns: number;
  /** Row height in CSS pixels at the base viewport. Default 80. */
  readonly rowHeight: number;
  /**
   * Per-widget size overrides keyed by `WidgetDefinition.slug`. `null` /
   * missing = use the widget's default `size` from its definition.
   */
  readonly widgetSizes?: Readonly<Record<string, WidgetSize>>;
  /**
   * Optional slug ordering — when present, overrides the widget's
   * the widget's declared order for this layout. Widgets not listed are appended
   * in their declared order.
   */
  readonly widgetOrder?: readonly string[];
  /**
   * Per-breakpoint overrides. Each entry is a partial layout merged onto
   * the base when the viewport hits the corresponding breakpoint.
   * Missing breakpoints fall through to the base.
   */
  readonly breakpoints?: Readonly<Partial<Record<DashboardBreakpoint, DashboardLayoutOverride>>>;
}

/** Conventional 12-column responsive grid with 80 px row height. */
export const DEFAULT_DASHBOARD_LAYOUT: DashboardLayout = Object.freeze({
  columns: 12,
  rowHeight: 80,
});
