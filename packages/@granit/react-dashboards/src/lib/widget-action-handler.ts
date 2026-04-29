import type { WidgetAction, WidgetActionKind } from '@granit/dashboards';

/**
 * Context passed to a {@link WidgetActionHandler} at dispatch time.
 *
 * `row` is the data payload from the firing widget — a table row,
 * a chart bucket, a clicked map marker. Shape is widget-kind-
 * specific; handlers narrow it themselves. `aliases` are the dashboard's
 * resolved entity aliases (P2.3), surfaced for handlers that
 * incorporate them in navigation targets or export parameters.
 */
export interface WidgetActionDispatchContext {
  /** Data payload from the firing widget (row, bucket, marker, ...). */
  readonly row?: Readonly<Record<string, unknown>>;
  /** Resolved entity aliases keyed by alias name. */
  readonly aliases?: Readonly<Record<string, string>>;
  /**
   * Active dashboard view's setter — handlers that switch views
   * (`OpenDashboardView`) read this. `null` outside a multi-view
   * dashboard.
   */
  readonly setView?: ((name: string) => void) | null;
  /**
   * Resolved + substituted action params (`row.x` and `${aliasName}`
   * already expanded). Handlers consume this rather than re-parsing
   * `action.params` themselves.
   */
  readonly params: Readonly<Record<string, string>>;
}

/**
 * Handler signature for one {@link WidgetActionKind}. Receives the
 * action declaration plus the dispatch context (row data, aliases,
 * resolved params, view setter).
 */
export type WidgetActionHandler = (
  action: WidgetAction,
  context: WidgetActionDispatchContext
) => void;

/**
 * Registry mapping each {@link WidgetActionKind} to a handler.
 * Composition pattern mirrors the read-mode `WidgetRegistry`: apps
 * compose framework defaults with their own per-kind overrides.
 */
export type WidgetActionHandlerRegistry = Readonly<Record<WidgetActionKind, WidgetActionHandler>>;

/**
 * Composes multiple handler registries into one, last-wins on key
 * collision. Mirrors `composeRegistries` for renderers — same
 * precedence semantics so apps overriding a built-in handler (e.g.
 * `Navigate` wired to React Router instead of `window.location.href`)
 * win by passing their registry last.
 */
export function composeWidgetActionHandlers(
  ...registries: readonly Partial<WidgetActionHandlerRegistry>[]
): WidgetActionHandlerRegistry {
  return Object.freeze(Object.assign({}, ...registries)) as WidgetActionHandlerRegistry;
}
