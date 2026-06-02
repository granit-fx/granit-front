import type { EntityFacet } from '@granit/entities';
import type { FilterEntry } from '@granit/query-engine';

/**
 * Cache key for one calendar range query. Keyed by
 * `(entityName, from, to, calendar, filtersKey, search)` so distinct
 * windows, named-calendar selections, or filter / search criteria
 * don't collide. Calling
 * `queryClient.invalidateQueries({ queryKey: ['entities', 'calendar', entityName] })`
 * blasts every cached window for one entity, which is what apps
 * typically want after a relevant mutation.
 */
export function entityCalendarQueryKey(
  entityName: string,
  from: string,
  to: string,
  calendar?: string | null,
  filters?: readonly FilterEntry[],
  search?: string
): readonly [
  'entities',
  'calendar',
  string,
  string,
  string,
  string | null,
  string | null,
  string | null,
] {
  const filtersKey =
    filters && filters.length > 0
      ? [...filters]
          .map((f) => `${f.field}.${f.operator}=${f.value}`)
          .sort((a, b) => a.localeCompare(b))
          .join('&')
      : null;
  return [
    'entities',
    'calendar',
    entityName,
    from,
    to,
    calendar ?? null,
    filtersKey,
    search ?? null,
  ] as const;
}

/**
 * Cache key for the entity discovery tree. Distinct from the per-entity
 * manifest keys (see {@link entityManifestQueryKey}) — the discovery
 * payload is shaped only by `(user-perms-hash, culture)` and only changes
 * on deployments or permission grants, while the per-entity manifest
 * additionally varies with the requested facets.
 */
export const entityDiscoveryQueryKey = () => ['entities', 'discovery'] as const;

/**
 * Cache key for one per-entity manifest. Keyed by `(name, facets-csv)` so a
 * caller asking for the slim `?facets=identity` payload doesn't collide
 * with a prior request that fetched the full manifest, and a permission
 * change that bumps the manifest version invalidates both at once via
 * `queryClient.invalidateQueries({ queryKey: ['entities', 'manifest'] })`.
 *
 * `facets` is normalised to a sorted CSV so callers passing
 * `['forms', 'identity']` and `['identity', 'forms']` share one cache slot.
 */
export function entityManifestQueryKey(
  name: string,
  facets?: readonly EntityFacet[]
): readonly ['entities', 'manifest', string, string | null] {
  const facetsKey =
    facets && facets.length > 0 ? [...facets].sort((a, b) => a.localeCompare(b)).join(',') : null;
  return ['entities', 'manifest', name, facetsKey] as const;
}

/**
 * Cache key for one source row's relation aggregates. Keyed by
 * `(entityName, entityId, relations-csv)` so a partial query for a
 * subset of relations doesn't collide with the "every relation" call,
 * and `queryClient.invalidateQueries({ queryKey: ['entities', 'relations', entityName, entityId] })`
 * blasts every variant when the source row mutates.
 *
 * `relations` is normalised to a sorted CSV so `['Invoices', 'Payments']`
 * and `['Payments', 'Invoices']` share one cache slot.
 */
export function entityRelationAggregatesQueryKey(
  entityName: string,
  entityId: string,
  relations?: readonly string[]
): readonly ['entities', 'relations', string, string, string | null] {
  const relationsKey =
    relations && relations.length > 0
      ? [...relations].sort((a, b) => a.localeCompare(b)).join(',')
      : null;
  return ['entities', 'relations', entityName, entityId, relationsKey] as const;
}
