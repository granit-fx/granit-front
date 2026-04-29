import type { DashboardRenderedWidget } from '@granit/dashboards';
import type { ComponentType } from 'react';

/**
 * Renderer signature for a widget kind on the **rendered** side. The component
 * receives a {@link DashboardRenderedWidget} (one slot from the bundle response
 * `useDashboardRender` returns) and is responsible for narrowing the
 * `widget.snapshot` payload via the per-kind type guard before consuming it.
 *
 * Symmetric to {@link WidgetRenderer} on the **definition** side: that one
 * dispatches by lowercase `widget.type` (`'markdown'` / `'image'` / …) and
 * receives a typed `WidgetDefinition`. This one dispatches by PascalCase
 * `widget.widgetType` (`'Markdown'` / `'Kpi'` / …) and receives the
 * snapshot envelope.
 */
export type SnapshotWidgetRenderer = ComponentType<{
  readonly widget: DashboardRenderedWidget;
}>;

/**
 * Mapping from `widget.widgetType` (PascalCase wire discriminator) to a
 * renderer component.
 *
 * The framework ships defaults for the static-content kinds (`Markdown` /
 * `Image` / `Text`). Downstream packages register their own (`@granit/react-
 * analytics` adds `Kpi`, `Chart`, `Table`, `Pivot`, `Map`; consuming apps
 * may add custom widget kinds for their domain).
 *
 * Composed via {@link composeSnapshotRegistries} at provider creation time —
 * the registry value itself is intentionally frozen (no runtime mutation).
 */
export type SnapshotWidgetRegistry = Readonly<Record<string, SnapshotWidgetRenderer>>;

/**
 * Composes multiple snapshot registries into one, with later entries
 * overriding earlier ones for the same `widgetType`. Layer framework defaults
 * + analytics renderers + app-specific overrides without mutating shared
 * state.
 *
 * @example
 *   const registry = composeSnapshotRegistries(
 *     defaultSnapshotWidgetRegistry,
 *     defaultAnalyticsSnapshotWidgetRegistry,
 *     { CompanyLogo: CompanyLogoSnapshotWidget }
 *   );
 */
export function composeSnapshotRegistries(
  ...registries: readonly SnapshotWidgetRegistry[]
): SnapshotWidgetRegistry {
  return Object.freeze(Object.assign({}, ...registries));
}
