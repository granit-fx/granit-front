import type { DashboardCategory } from './dashboard-category.js';
import type { DashboardLayout } from './dashboard-layout.js';
import type { WidgetDefinition } from './widget-definition.js';

/**
 * Top-level descriptor of a dashboard — name, classification, the widgets it
 * contains, and how they are laid out. This is the JSON shape the backend
 * registry exposes and the frontend renders.
 *
 * Widgets and layout are intentionally separate fields so a single widget can
 * be reused across multiple layouts (compact / detailed) and so layout edits
 * never require re-emitting widget content.
 */
export interface DashboardDefinition {
  readonly id: string;
  readonly name: string;
  readonly category: DashboardCategory;
  readonly description?: string;
  /** Catalog of widgets, keyed by `id`. References from `layout.items.widgetId`. */
  readonly widgets: readonly WidgetDefinition[];
  readonly layout: DashboardLayout;
}
