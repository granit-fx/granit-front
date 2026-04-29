import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

/**
 * Pure helper used by {@link EditableDashboard} after a sortable drag-end:
 * given a source slug and a target slug, returns a new
 * {@link DashboardDefinition} whose widgets are repositioned so the source
 * widget sits where the target was, with subsequent widgets shifted by one.
 *
 * The returned widgets carry a freshly dense-ranked `position` field
 * (0-based, contiguous) — matches the backend invariant on
 * `WidgetInstance.Position` so a save round-trip survives without a
 * re-normalisation pass.
 *
 * Edge cases:
 * - Source slug not found → returns the input definition unchanged.
 * - Target slug not found → returns the input definition unchanged.
 * - Source === target → returns the input definition unchanged.
 *
 * Exported standalone so tests + custom editor wrappers (e.g. apps shipping
 * their own DnD layer) can compose the same reorder logic.
 */
export function reorderWidgets(
  definition: DashboardDefinition,
  sourceSlug: string,
  targetSlug: string
): DashboardDefinition {
  if (sourceSlug === targetSlug) return definition;

  const widgets = [...definition.widgets].sort((a, b) => a.position - b.position);
  const fromIndex = widgets.findIndex((w) => w.slug === sourceSlug);
  const toIndex = widgets.findIndex((w) => w.slug === targetSlug);
  if (fromIndex === -1 || toIndex === -1) return definition;

  const [moved] = widgets.splice(fromIndex, 1);
  if (!moved) return definition;
  widgets.splice(toIndex, 0, moved);

  const repositioned: WidgetDefinition[] = widgets.map((widget, index) => ({
    ...widget,
    position: index,
  }));

  return { ...definition, widgets: repositioned };
}
