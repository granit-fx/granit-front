import type { WidgetDefinition } from '@granit/dashboards';
import type { ComponentType } from 'react';

/**
 * Renderer signature for a widget type. The component receives the typed
 * widget definition and is responsible for rendering its body — the surrounding
 * frame (title, padding, error boundary) is handled by `<WidgetCard>`.
 */
export type WidgetRenderer<T extends WidgetDefinition = WidgetDefinition> = ComponentType<{
  readonly widget: T;
}>;

/**
 * Mapping from widget `type` discriminator to a renderer component.
 *
 * The framework ships defaults for `markdown` / `image` / `text`. Downstream
 * packages register their own (Analytics adds `kpi`, `chart`, `table`, `pivot`;
 * IoT adds `gauge`, `camera-feed`, `alarm-light`; consuming apps add custom).
 *
 * A registry is just a frozen object — there's intentionally no class and no
 * mutation API at runtime. New entries are composed at provider creation time.
 */
export type WidgetRegistry = Readonly<Record<string, WidgetRenderer>>;

/**
 * Composes multiple registries into one, with later entries overriding earlier
 * ones for the same `type`. Use this to layer framework defaults + analytics
 * widgets + app-specific overrides without mutating shared state.
 *
 * @example
 *   const registry = composeRegistries(
 *     defaultWidgetRegistry,
 *     analyticsWidgetRegistry,
 *     { 'company-logo': CompanyLogoWidget }
 *   );
 */
export function composeRegistries(...registries: readonly WidgetRegistry[]): WidgetRegistry {
  return Object.freeze(Object.assign({}, ...registries));
}
