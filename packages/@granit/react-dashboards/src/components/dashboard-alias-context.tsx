import { createContext, useContext, useMemo } from 'react';

/**
 * Resolved alias values surfaced to dashboard consumers — widget
 * action handlers (navigation with the entity id), breadcrumbs,
 * variable substitution in filter clauses (`${currentCustomer}`),
 * and any custom widget that scopes its query by alias.
 *
 * Keyed by `EntityAlias.name`. Aliases that fail to resolve at
 * provider construction (missing route param, no tenant, no user
 * selection) are absent from the map — consumers check for presence
 * rather than dealing with `null` values.
 */
export type DashboardAliasValues = Readonly<Record<string, string>>;

const DashboardAliasContext = createContext<DashboardAliasValues | null>(null);

export interface DashboardAliasProviderProps {
  /**
   * Resolved alias map. Apps build this from the dashboard's
   * `definition.aliases` + their own resolution context (route
   * params, current tenant, user selections) using
   * {@link resolveDashboardAliases}, then feed the result here.
   */
  readonly values: DashboardAliasValues;
  readonly children: React.ReactNode;
}

/**
 * Provider for resolved alias values. Pairs with
 * {@link useDashboardAliases} for read access. The provider is
 * intentionally **uncontrolled-only**: alias resolution depends on
 * external context (URL params, tenant, picker state) that the parent
 * already owns, so there's no setter inside the provider.
 *
 * Apps wanting reactive resolution wrap their parent's resolution
 * context in `useMemo`+`resolveDashboardAliases` and re-render this
 * provider with fresh values on context changes.
 */
export function DashboardAliasProvider({ values, children }: DashboardAliasProviderProps) {
  // Memoise the value object so descendants don't see a new reference
  // every render (even when the parent passes the same map back).
  const stable = useMemo(() => values, [values]);
  return <DashboardAliasContext.Provider value={stable}>{children}</DashboardAliasContext.Provider>;
}

/**
 * Reads the current alias values map. Returns `null` outside a
 * provider — consumers (action handlers, variable substitution)
 * gracefully degrade to the unscoped behaviour when no provider is
 * mounted.
 */
export function useDashboardAliases(): DashboardAliasValues | null {
  return useContext(DashboardAliasContext);
}
