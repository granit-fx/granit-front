import type { DashboardCategory } from './dashboard-category';
import type { DashboardFilter } from './dashboard-filter';
import type { DashboardLayout } from './dashboard-layout';
import type { DashboardTimeWindow } from './dashboard-time-window';
import type { DashboardView } from './dashboard-view';
import type { EntityAlias } from './entity-alias';
import type { WidgetDefinition } from './widget-definition';

/**
 * Top-level descriptor of a dashboard — a declarative catalogue entry
 * shipped by a Granit module. Mirrors `Granit.Dashboards.DashboardDefinition`.
 *
 * The definition is pure declaration: no runtime, no persistence. When
 * an admin imports a definition (story B4), the framework deep-copies
 * it into a persisted `Dashboard` aggregate (story B2). Module upgrades
 * do NOT retro-edit imported dashboards — drift is surfaced via
 * {@link version} and an admin-driven re-sync action (ADR-038 §3).
 */
export interface DashboardDefinition {
  /**
   * Unique wire identifier — `Granit.{Module}.{DashboardName}`,
   * PascalCase, dot-separated.
   */
  readonly name: string;
  /** Catalogue grouping. Drives section ordering in the import dialog. */
  readonly category: DashboardCategory;
  /**
   * Whether this dashboard is mandated by the platform operator. When
   * true, imported instances cannot be deleted by tenant admins (only
   * re-synced).
   */
  readonly isSystem: boolean;
  /**
   * Semver of the definition shape. Bumped when the widget set changes
   * in a breaking way.
   */
  readonly version: string;
  /** Grid layout configuration. */
  readonly layout: DashboardLayout;
  /**
   * Default time window applied to every data-bound widget that does
   * not carry its own override. `null` / missing = the frontend falls
   * back to its global default.
   */
  readonly defaultTimeWindow?: DashboardTimeWindow | null;
  /**
   * Widgets shipped by this dashboard, in declared order. For
   * single-view dashboards this is the rendered list. For multi-view
   * dashboards ({@link views} non-null), the runtime renders the active
   * view's widgets and treats this property as the entry-view fallback.
   */
  readonly widgets: readonly WidgetDefinition[];
  /**
   * Named views — separate widget arrangements within the same
   * dashboard. `null` / missing = single-view dashboard rendering
   * {@link widgets}. P2.1.
   */
  readonly views?: readonly DashboardView[] | null;
  /**
   * Entry-view name when {@link views} is non-null. `null` / missing =
   * the runtime falls back to the first view in {@link views}.
   */
  readonly defaultView?: string | null;
  /**
   * Dashboard-scoped filters declared by this dashboard. Toolbar-exposed
   * filters become user-editable controls above the grid. `null` /
   * missing = the dashboard has no filters beyond what individual
   * widgets carry. P2.5.
   */
  readonly filters?: readonly DashboardFilter[] | null;
  /**
   * Named entity bindings — see {@link EntityAlias}. Each alias is
   * resolved at render time by its registered resolver. `null` /
   * missing = the dashboard does not take entity parameters. P2.3.
   */
  readonly aliases?: readonly EntityAlias[] | null;
}
