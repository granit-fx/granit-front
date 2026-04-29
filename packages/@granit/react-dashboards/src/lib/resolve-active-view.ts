import type { DashboardDefinition, DashboardLayout, WidgetDefinition } from '@granit/dashboards';

/**
 * Result of {@link resolveActiveView} — the widget pool + layout the
 * dashboard should render given a (possibly null) active view name.
 *
 * `activeViewName` is `null` for single-view dashboards (no `views`
 * entries) and for the rare case where the requested view isn't found
 * (the resolver falls back to the top-level pool to keep the dashboard
 * renderable rather than blank).
 */
export interface ActiveDashboardView {
  /** The widgets to render — view-scoped or top-level fallback. */
  readonly widgets: readonly WidgetDefinition[];
  /** Layout to apply — view's `layout` override falls back to the dashboard's. */
  readonly layout: DashboardLayout;
  /** Active view's name, or `null` for single-view dashboards. */
  readonly activeViewName: string | null;
}

/**
 * Picks the active {@link DashboardView} given a (possibly null)
 * requested view name, applying the framework's fallback chain:
 *
 * 1. `currentViewName` — explicit selection (controlled state, URL
 *    binding, action handler).
 * 2. {@link DashboardDefinition.defaultView} — author-declared entry
 *    view.
 * 3. The first view in {@link DashboardDefinition.views}.
 *
 * For single-view dashboards (`views` empty / null), returns the
 * top-level `widgets` + `layout` and `activeViewName: null`. For
 * multi-view dashboards where the requested view isn't found, returns
 * the same fallback so the dashboard stays renderable rather than
 * going blank.
 *
 * The view's optional `layout` override **replaces** the dashboard's
 * `layout` when set (does NOT merge — `DashboardLayoutOverride` is for
 * breakpoint composition, not view composition). This matches the
 * backend's `DashboardView.Layout: DashboardLayout?` semantics.
 *
 * Pure function, no React deps.
 */
export function resolveActiveView(
  definition: DashboardDefinition,
  currentViewName: string | null = null
): ActiveDashboardView {
  const views = definition.views;
  if (!views || views.length === 0) {
    return { widgets: definition.widgets, layout: definition.layout, activeViewName: null };
  }
  const requested = currentViewName ?? definition.defaultView ?? views[0]?.name ?? null;
  const view = requested ? views.find((v) => v.name === requested) : undefined;
  if (!view) {
    return { widgets: definition.widgets, layout: definition.layout, activeViewName: null };
  }
  return {
    widgets: view.widgets,
    layout: view.layout ?? definition.layout,
    activeViewName: view.name,
  };
}
