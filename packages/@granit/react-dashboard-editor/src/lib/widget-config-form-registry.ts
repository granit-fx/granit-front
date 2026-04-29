import type { WidgetDefinition } from '@granit/dashboards';
import type { ComponentType } from 'react';

/**
 * Props every kind-specific config form receives. Mirrors the read-mode
 * `WidgetRenderer` shape on the registry side: the form takes the typed
 * widget definition + an `onChange` callback emitting a fresh widget
 * whose extra fields the form has mutated.
 *
 * `slug` / `position` / `size` are deliberately NOT editable through this
 * surface — the drawer owns kind-specific fields only. Slug is immutable
 * (composes the localization key + drives DnD identity); position is
 * owned by `reorderWidgets`; size is owned by the (future) resize gesture
 * + the catalog's `defaultSize`.
 */
export interface WidgetConfigFormProps<T extends WidgetDefinition = WidgetDefinition> {
  readonly widget: T;
  readonly onChange: (next: T) => void;
}

/**
 * React component rendering a kind-specific config form. The component is
 * fully presentational — no internal mutable state, no debouncing — so
 * callers can wire their own validation / submission pipeline (typically
 * a controlled form mirroring the parent dashboard state).
 */
export type WidgetConfigForm<T extends WidgetDefinition = WidgetDefinition> = ComponentType<
  WidgetConfigFormProps<T>
>;

/**
 * Mapping from widget `type` discriminator to a config-form component.
 * Same composition pattern as `WidgetRegistry` on the read-mode side —
 * downstream packages contribute their own (analytics adds `kpi` /
 * `chart` / `table` / `pivot` / `map`, IoT adds its sensor variants, etc.).
 */
export type WidgetConfigFormRegistry = Readonly<Record<string, WidgetConfigForm>>;

/**
 * Composes multiple config-form registries into one, with later entries
 * overriding earlier ones on `type` collision. Mirrors `composeRegistries`
 * for renderers — same precedence semantics so apps that override a
 * built-in form (e.g. a custom Markdown editor with a live preview) win
 * by passing their registry last.
 */
export function composeWidgetConfigFormRegistries(
  ...registries: readonly WidgetConfigFormRegistry[]
): WidgetConfigFormRegistry {
  return Object.freeze(Object.assign({}, ...registries));
}
