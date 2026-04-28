import type { DashboardCategory } from './dashboard-category.js';
import type { DashboardLayout } from './dashboard-layout.js';
import type { WidgetDefinition } from './widget-definition.js';

/**
 * Top-level descriptor of a dashboard — a declarative catalogue entry shipped
 * by a Granit module. Mirrors `Granit.Dashboards.DashboardDefinition`.
 *
 * The definition is pure declaration: no runtime, no persistence. When an
 * admin imports a definition (story B4), the framework deep-copies it into a
 * persisted `Dashboard` aggregate (story B2). Module upgrades do NOT retro-edit
 * imported dashboards — drift is surfaced via {@link version} and an
 * admin-driven re-sync action (ADR-038 §3).
 */
export interface DashboardDefinition {
  /**
   * Unique wire identifier — `Granit.{Module}.{DashboardName}`, PascalCase,
   * dot-separated. Used as the resource key for the dashboard's localized
   * title (`Dashboard:{Name}`) and as the import endpoint parameter.
   */
  readonly name: string;
  /** Catalogue grouping. Drives section ordering in the import dialog. */
  readonly category: DashboardCategory;
  /**
   * Whether this dashboard is mandated by the platform operator. When true,
   * imported instances cannot be deleted by tenant admins (only re-synced).
   * Defaults to false on the backend — framework modules ship suggestions,
   * not impositions (ADR-038 §5).
   */
  readonly isSystem: boolean;
  /**
   * Semver of the definition shape. Bumped when the widget set changes in a
   * breaking way; surfaced to admins as drift after import (ADR-038 §3).
   */
  readonly version: string;
  /** Grid layout configuration. */
  readonly layout: DashboardLayout;
  /** Widgets shipped by this dashboard, in declared order. */
  readonly widgets: readonly WidgetDefinition[];
}
