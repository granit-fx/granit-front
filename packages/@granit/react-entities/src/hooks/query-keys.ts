import type { EntityFacet } from '@granit/entities';
import type { FilterEntry, QueryRequest } from '@granit/query-engine';

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
 * Cache key for one entity row read (`GET {basePath}/{id}`). Keyed by
 * `(entityName, id)` so the calendar, kanban, detail, and form pages all
 * share one cache slot per row, and
 * `queryClient.invalidateQueries({ queryKey: ['entities', 'row', entityName] })`
 * blasts every cached row for one entity after a mutation. `entityName`
 * is the wire identifier (e.g. `Granit.Parties.Party`); using it — not the
 * base path — keeps the key stable across the two URL schemes the read
 * call-sites use (`{basePath}/{id}` vs `/api/v1/{entityName}/{id}`).
 */
export function entityRowQueryKey(
  entityName: string,
  id: string
): readonly ['entities', 'row', string, string] {
  return ['entities', 'row', entityName, id] as const;
}

/**
 * Prefix for every cached row of one entity — pass to `invalidateQueries`
 * after a create / update / delete so all open reads for that entity
 * refetch.
 */
export function entityRowsQueryKey(entityName: string): readonly ['entities', 'row', string] {
  return ['entities', 'row', entityName] as const;
}

/**
 * Cache key for the host gallery view's grouped infinite query. Keyed by
 * `(basePath, request)` so distinct filter / sort / groupBy windows don't
 * collide. The `granit` root and `entity-gallery-grouped` segment keep it
 * distinct from the flat `<EntityGallery>` query the framework owns.
 */
export function entityGalleryGroupedQueryKey(
  basePath: string,
  request: QueryRequest
): readonly ['granit', 'entity-gallery-grouped', string, QueryRequest] {
  return ['granit', 'entity-gallery-grouped', basePath, request] as const;
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
