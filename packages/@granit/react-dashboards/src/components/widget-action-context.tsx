import { createContext, useCallback, useContext, useMemo } from 'react';

import { defaultWidgetActionHandlers } from '../lib/default-widget-action-handlers';
import { expandActionParams } from '../lib/expand-action-params';

import { useDashboardAliases } from './dashboard-alias-context';
import { useDashboardView } from './dashboard-view-context';

import type { WidgetActionHandlerRegistry } from '../lib/widget-action-handler';
import type { WidgetAction } from '@granit/dashboards';

/**
 * Dispatcher signature returned by {@link useWidgetActionDispatcher}.
 * Widget renderers call this from their click handlers — the
 * dispatcher resolves the action's params against the dispatch
 * context (row data + dashboard aliases + view setter) and forwards
 * to the matching handler from the registry.
 *
 * `data` is the widget-kind-specific row payload. Tables pass the
 * clicked row, charts pass the bucket, maps pass the marker. Shape
 * is opaque — the framework doesn't require a specific schema.
 */
export type WidgetActionDispatcher = (
  action: WidgetAction,
  data?: Readonly<Record<string, unknown>>
) => void;

const WidgetActionContext = createContext<WidgetActionHandlerRegistry | null>(null);

export interface WidgetActionProviderProps {
  /**
   * Per-kind handler registry. Compose with framework defaults via
   * {@link composeWidgetActionHandlers}. Omit to use the framework's
   * defaults verbatim — useful for self-contained demos and Storybook
   * stories.
   */
  readonly handlers?: WidgetActionHandlerRegistry;
  readonly children: React.ReactNode;
}

/**
 * Provider for the {@link WidgetActionHandler} registry. Mounted at
 * (or above) the dashboard tree so {@link useWidgetActionDispatcher}
 * resolves the right handler per kind.
 *
 * Falls back to {@link defaultWidgetActionHandlers} when no provider
 * is mounted — the dispatcher works out of the box without explicit
 * wiring, with the trade-off that `Navigate` triggers a full page
 * load (no React Router integration).
 */
export function WidgetActionProvider({ handlers, children }: WidgetActionProviderProps) {
  return (
    <WidgetActionContext.Provider value={handlers ?? defaultWidgetActionHandlers}>
      {children}
    </WidgetActionContext.Provider>
  );
}

/**
 * Hook returning a dispatcher that resolves a widget action against
 * the surrounding context (alias provider, view provider, action
 * registry) and invokes the matching handler.
 *
 * Substitution rules applied at dispatch time:
 *
 * - `${row.field}` placeholders in `target` and `params` resolve
 *   against the `data` argument.
 * - `${aliasName}` placeholders resolve against the surrounding
 *   {@link DashboardAliasProvider} when mounted.
 * - Unknown placeholders are left verbatim (consumer-side decision).
 *
 * Calling the dispatcher when no provider is mounted falls back to
 * the framework's default handlers — the dispatcher always works,
 * just with the framework's opinionated `window.location` defaults
 * instead of a custom in-app router.
 */
export function useWidgetActionDispatcher(): WidgetActionDispatcher {
  const registry = useContext(WidgetActionContext) ?? defaultWidgetActionHandlers;
  const aliases = useDashboardAliases();
  const viewCtx = useDashboardView();

  const dispatch = useCallback<WidgetActionDispatcher>(
    (action, data) => {
      const params = expandActionParams(action.params, {
        row: data,
        aliases: aliases ?? undefined,
      });
      const handler = registry[action.kind];
      if (!handler) return;
      handler(
        // Re-stamp the action with the expanded target so handlers
        // can use `action.target` directly without re-parsing.
        {
          ...action,
          target: action.target.replaceAll(
            /\$\{([A-Za-z][A-Za-z0-9_.]*)\}/g,
            (match, expr: string) => {
              if (expr.startsWith('row.') && data) {
                const value = data[expr.slice(4)];
                return value !== undefined && value !== null ? String(value) : match;
              }
              return aliases?.[expr] ?? match;
            }
          ),
        },
        {
          row: data,
          aliases: aliases ?? undefined,
          setView: viewCtx?.setCurrentView ?? null,
          params,
        }
      );
    },
    [registry, aliases, viewCtx]
  );

  return dispatch;
}

/**
 * Memoised dispatcher returning a stable reference across renders
 * when its dependencies haven't changed — useful for handlers
 * passed down as React props that drive component memoisation.
 *
 * Equivalent to `useWidgetActionDispatcher()` plus a `useMemo`
 * wrapper; exported for callers that want to be explicit about the
 * memoisation contract.
 */
export function useStableWidgetActionDispatcher(): WidgetActionDispatcher {
  const dispatch = useWidgetActionDispatcher();
  return useMemo(() => dispatch, [dispatch]);
}
