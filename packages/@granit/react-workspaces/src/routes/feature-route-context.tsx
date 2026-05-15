import {
  resolveFeatureRoute,
  type FeatureRouteSpec,
  type FeatureRouteTable,
  type WorkspaceItemResponse,
} from '@granit/workspaces';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

/**
 * React context that carries the host-supplied `FeatureRouteTable`
 * (ADR-057 §5) down to the workspace renderer. Hosts wrap the navigation
 * tree once at startup; nested renderers consume the table without
 * threading it through props.
 */
const FeatureRouteTableContext = createContext<FeatureRouteTable | null>(null);

export interface FeatureRouteTableProviderProps {
  readonly table: FeatureRouteTable;
  readonly children: ReactNode;
}

/**
 * Host-side provider. Place once near the navigation root.
 *
 * @example
 * ```tsx
 * const ROUTES: FeatureRouteTable = {
 *   'identity.users.list': { path: '/users' },
 *   'invoicing.invoices.list': { path: '/invoicing' },
 * };
 *
 * <FeatureRouteTableProvider table={ROUTES}>
 *   <WorkspaceNav />
 * </FeatureRouteTableProvider>
 * ```
 */
export function FeatureRouteTableProvider({
  table,
  children,
}: FeatureRouteTableProviderProps): ReactNode {
  return (
    <FeatureRouteTableContext.Provider value={table}>{children}</FeatureRouteTableContext.Provider>
  );
}

/**
 * Hook variant: read the route table from context. Returns an empty
 * table if no provider was mounted — the renderer then renders all
 * `Feature` items as placeholders, which matches the spec for "feature
 * without a frontend route" (ADR-057 §5, bullet 3).
 */
export function useFeatureRouteTable(): FeatureRouteTable {
  return useContext(FeatureRouteTableContext) ?? EMPTY_TABLE;
}

const EMPTY_TABLE: FeatureRouteTable = Object.freeze({});

/**
 * Resolved descriptor for a workspace item, ready for a `<NavLink>` or
 * `<a>` to consume. `href` is `null` for items the renderer should NOT
 * link out — typically a `Feature` whose route name is missing from the
 * host's table.
 */
export interface ResolvedWorkspaceItem {
  /** Final SPA path / absolute URL for this item, or `null` if unresolvable. */
  readonly href: string | null;
  /**
   * `true` when the item references a `Feature` whose route is not
   * registered in the host table — the renderer should display it as a
   * disabled placeholder (greyed-out label + tooltip).
   */
  readonly missingRoute: boolean;
  /** Pass-through, useful for tooltip copy on missing routes. */
  readonly featureName: string | null;
  /** Resolved spec when the lookup hit (mostly for future expansion). */
  readonly spec: FeatureRouteSpec | null;
}

/**
 * Resolve one `WorkspaceItemResponse` against the host's route table.
 *
 * - `Feature` items: lookup by `routeName` (falling back to `featureName`),
 *   return the SPA path or signal `missingRoute`.
 * - `Link` items: pass `linkUrl` through unchanged (internal SPA route or
 *   external URL — see ADR-057 §6, `linkUrl` is not deprecated).
 * - `Entity` / `Dashboard` / `SubWorkspace`: out of scope for this hook —
 *   `href` is `null` because their URL is computed elsewhere (entity URL
 *   helpers, dashboard routes, sub-workspace recursion).
 *
 * Pure function — no React state. Exported so non-React consumers
 * (testing, server-side rendering) can reuse the same logic.
 */
export function resolveWorkspaceItem(
  item: WorkspaceItemResponse,
  table: FeatureRouteTable
): ResolvedWorkspaceItem {
  if (item.kind === 'Feature') {
    const lookupKey = item.routeName ?? item.featureName;
    if (lookupKey === null || lookupKey.length === 0) {
      return {
        href: null,
        missingRoute: true,
        featureName: item.featureName,
        spec: null,
      };
    }
    const spec = resolveFeatureRoute(table, lookupKey);
    return {
      href: spec?.path ?? null,
      missingRoute: spec === null,
      featureName: item.featureName,
      spec,
    };
  }
  if (item.kind === 'Link') {
    return { href: item.linkUrl, missingRoute: false, featureName: null, spec: null };
  }
  return { href: null, missingRoute: false, featureName: null, spec: null };
}

/**
 * React hook variant of {@link resolveWorkspaceItem} that pulls the
 * route table from context. Memoised on the item identity + table.
 */
export function useResolvedWorkspaceItem(item: WorkspaceItemResponse): ResolvedWorkspaceItem {
  const table = useFeatureRouteTable();
  return useMemo(() => resolveWorkspaceItem(item, table), [item, table]);
}
