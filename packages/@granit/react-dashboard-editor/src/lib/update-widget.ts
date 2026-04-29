import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

/**
 * Pure helper: returns a new {@link DashboardDefinition} with the widget
 * matching `slug` replaced by `next`. The replacement preserves the
 * existing `slug` + `position` (callers can't accidentally rename or
 * reorder a widget through the config drawer — those are owned by
 * {@link reorderWidgets} / {@link addWidget}).
 *
 * Slug not found → returns the input definition unchanged. This keeps the
 * editor pipeline idempotent under late-arriving onChange callbacks (e.g.
 * a debounced form submission firing after the widget was deleted).
 */
export function updateWidget(
  definition: DashboardDefinition,
  slug: string,
  next: WidgetDefinition
): DashboardDefinition {
  const index = definition.widgets.findIndex((w) => w.slug === slug);
  if (index === -1) return definition;
  const current = definition.widgets[index];
  if (!current) return definition;
  const merged: WidgetDefinition = { ...next, slug: current.slug, position: current.position };
  const widgets = [...definition.widgets];
  widgets[index] = merged;
  return { ...definition, widgets };
}

/**
 * Pure helper: returns a new {@link DashboardDefinition} with the widget
 * matching `slug` removed and remaining widgets re-ranked into a dense
 * 0-based `position` sequence — same invariant the backend enforces on
 * `WidgetInstance.Position`.
 *
 * Slug not found → returns the input definition unchanged.
 */
export function removeWidget(definition: DashboardDefinition, slug: string): DashboardDefinition {
  const remaining = definition.widgets.filter((w) => w.slug !== slug);
  if (remaining.length === definition.widgets.length) return definition;
  const repositioned = [...remaining]
    .sort((a, b) => a.position - b.position)
    .map((widget, index) => ({ ...widget, position: index }));
  return { ...definition, widgets: repositioned };
}
