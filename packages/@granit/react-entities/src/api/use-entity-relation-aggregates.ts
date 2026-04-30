import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { RelationAggregatesResponse } from '@granit/entities';

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
  const relationsKey = relations && relations.length > 0 ? [...relations].sort().join(',') : null;
  return ['entities', 'relations', entityName, entityId, relationsKey] as const;
}

/**
 * `POST /entities/{name}/{id}/relations/aggregates` — returns the
 * computed `count / sum / avg / min / max` values per relation for one
 * source row, in a single batched round-trip. Mirrors
 * `RelationAggregatesEndpoint.HandleAsync`.
 *
 * Pass `relations` to slim the response to a specific subset; omit it
 * to get every relation the caller can read on the source entity
 * (handy for a detail page that wants every smart-button count
 * without replicating the manifest's relation list).
 *
 * The .NET handler caches the response 30 s sliding per
 * `(source, id, relation, perms-hash, culture)` — even an aggressive
 * refetch usually short-circuits at FusionCache rather than running
 * the SQL again. Front-side staleTime defaults to 30 s so React Query
 * doesn't refetch faster than the backend cache window; consumers can
 * raise it on screens where the values are merely informational.
 */
export function useEntityRelationAggregates(
  entityName: string,
  entityId: string,
  options: { readonly relations?: readonly string[]; readonly enabled?: boolean } = {}
): UseQueryResult<RelationAggregatesResponse> {
  const api = useGranitClient();
  const relations = options.relations;

  return useQuery({
    queryKey: entityRelationAggregatesQueryKey(entityName, entityId, relations),
    queryFn: async ({ signal }) => {
      const body = relations && relations.length > 0 ? { relations: [...relations].sort() } : null;
      const { data } = await api.post<RelationAggregatesResponse>(
        `/entities/${encodeURIComponent(entityName)}/${encodeURIComponent(entityId)}/relations/aggregates`,
        body,
        { signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName) && Boolean(entityId),
    staleTime: 30_000,
  });
}
