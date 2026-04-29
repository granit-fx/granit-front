import type { DashboardLayout } from './dashboard-layout.js';
import type { WidgetDefinition } from './widget-definition.js';

/**
 * Named view of a dashboard — a separate widget arrangement within the
 * same `DashboardDefinition`. Mirrors `Granit.Dashboards.DashboardView`
 * (P2.1).
 *
 * Views share the dashboard-level time window, entity aliases, and
 * breadcrumb context, but each view ships its own widget pool and
 * optional layout override.
 *
 * Single-view dashboards leave `DashboardDefinition.views` as `null`
 * and ship widgets via `DashboardDefinition.widgets`. Multi-view
 * dashboards override `views` with one or more `DashboardView` entries
 * and the runtime renders the entry named by `defaultView` (or the
 * first view if `defaultView` is `null`).
 */
export interface DashboardView {
  /**
   * View identifier, unique within the dashboard. Lowercase,
   * dot-separated for sub-views (e.g. `"list"`, `"detail"`,
   * `"history.heatmap"`). Used in URLs.
   */
  readonly name: string;
  /** Widgets shipped by this view, in declared order. */
  readonly widgets: readonly WidgetDefinition[];
  /**
   * Layout override scoped to this view. `null` / missing = inherit the
   * dashboard's `layout`.
   */
  readonly layout?: DashboardLayout | null;
  /**
   * Localization key for the view's display label. Defaults to
   * `Dashboard:{DashboardName}.View.{ViewName}` server-side when null.
   */
  readonly displayNameLocalizationKey?: string | null;
}
