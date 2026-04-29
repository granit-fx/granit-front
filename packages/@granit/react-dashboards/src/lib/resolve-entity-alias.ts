import {
  isRouteParamResolver,
  isStaticEntityResolver,
  isTenantContextResolver,
  isViewEntityResolver,
  type EntityAlias,
  type EntityAliasResolver,
} from '@granit/dashboards';

/**
 * Resolution context fed to {@link resolveEntityAliasResolver}. Apps
 * populate the fields their resolvers need:
 *
 * - `routeParams` — the URL parameter map (typically from React
 *   Router's `useParams()` or equivalent). Read by `route-param`
 *   resolvers.
 * - `viewParams` — the active view's parameters (P2.1 view stack).
 *   Read by `view-entity` resolvers.
 * - `currentTenantId` — current authenticated tenant id. Read by
 *   `tenant-context` resolvers.
 * - `userSelections` — user-driven picker selections keyed by alias
 *   name. Read by `user-selection` resolvers.
 *
 * Each field is optional — when the corresponding resolver kind isn't
 * present in the alias list, the field is unused. When a resolver
 * needs a field that's missing, the resolution returns `null` (no
 * crash — the dashboard renders without scoping).
 */
export interface AliasResolutionContext {
  readonly routeParams?: Readonly<Record<string, string | undefined>>;
  readonly viewParams?: Readonly<Record<string, string | undefined>>;
  readonly currentTenantId?: string | null;
  readonly userSelections?: Readonly<Record<string, string | null>>;
}

/**
 * Resolves a single {@link EntityAliasResolver} against a context.
 * Returns the resolved entity id, or `null` when the resolver kind
 * needs context fields the caller didn't provide.
 *
 * `user-selection` resolvers read from `userSelections[aliasName]`,
 * which means callers need to pass the alias name through (the
 * resolver itself doesn't carry one). Use {@link resolveEntityAlias}
 * when the alias is available.
 *
 * Pure function, no React deps.
 */
export function resolveEntityAliasResolver(
  resolver: EntityAliasResolver,
  context: AliasResolutionContext,
  aliasName?: string
): string | null {
  if (isStaticEntityResolver(resolver)) {
    return resolver.entityId;
  }
  if (isTenantContextResolver(resolver)) {
    return context.currentTenantId ?? null;
  }
  if (isRouteParamResolver(resolver)) {
    return context.routeParams?.[resolver.paramName] ?? null;
  }
  if (isViewEntityResolver(resolver)) {
    return context.viewParams?.[resolver.paramName] ?? null;
  }
  // user-selection — needs the alias name to look up the picker value.
  if (aliasName === undefined) return null;
  return context.userSelections?.[aliasName] ?? null;
}

/**
 * Convenience wrapper resolving a complete {@link EntityAlias}
 * (carries its own name).
 */
export function resolveEntityAlias(
  alias: EntityAlias,
  context: AliasResolutionContext
): string | null {
  return resolveEntityAliasResolver(alias.resolver, context, alias.name);
}

/**
 * Resolves every alias in the dashboard against the same context,
 * returning a `name → entityId` map. Aliases that resolve to `null`
 * are dropped from the result — apps consuming the map check for
 * presence rather than null values.
 *
 * Pure function. Use this from a route loader or context provider
 * to seed `<DashboardAliasProvider initialValues>`.
 */
export function resolveDashboardAliases(
  aliases: readonly EntityAlias[] | null | undefined,
  context: AliasResolutionContext
): Readonly<Record<string, string>> {
  const out: Record<string, string> = {};
  if (!aliases) return out;
  for (const alias of aliases) {
    const resolved = resolveEntityAlias(alias, context);
    if (resolved !== null) out[alias.name] = resolved;
  }
  return out;
}
