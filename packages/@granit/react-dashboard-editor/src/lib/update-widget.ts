import { nextUniqueSlug } from './widget-catalog';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

/**
 * Pure helper: returns a new {@link DashboardDefinition} with the widget
 * matching `slug` replaced by `next`. The replacement preserves the
 * existing `slug` + `position` (callers can't accidentally rename or
 * reorder a widget through the config drawer — placement is owned by the
 * grid layout, slug minting by {@link addWidget}).
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

/**
 * Pure helper: returns a new {@link DashboardDefinition} with a clone of the
 * widget matching `slug` appended to the pool. The clone:
 *
 * - gets a fresh unique slug (via {@link nextUniqueSlug} off the source type),
 * - drops `titleLocalizationKey` so the bridge recomposes
 *   `Widget:{Dashboard}.{newSlug}` for it on save (rather than pointing at the
 *   source's title),
 * - drops `x` / `y` so the editor first-fit-packs it into a free cell instead
 *   of overlapping the source,
 * - takes the next dense `position` (appended last).
 *
 * Slug not found → returns the input definition unchanged.
 */
export function duplicateWidget(
  definition: DashboardDefinition,
  slug: string
): DashboardDefinition {
  const source = definition.widgets.find((w) => w.slug === slug);
  if (!source) return definition;
  const existing = new Set(definition.widgets.map((w) => w.slug));
  const newSlug = nextUniqueSlug(source.type, existing);
  // Clone, then strip the fields the clone must re-derive: title (recomposed
  // from the new slug by the bridge) and coordinates (first-fit-packed by the
  // editor so the clone doesn't overlap the source).
  const clone: Record<string, unknown> = {
    ...source,
    slug: newSlug,
    position: definition.widgets.length,
  };
  delete clone['titleLocalizationKey'];
  delete clone['x'];
  delete clone['y'];
  return { ...definition, widgets: [...definition.widgets, clone as unknown as WidgetDefinition] };
}
