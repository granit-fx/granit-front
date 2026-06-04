import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export { entityRelationAggregatesQueryKey } from './query-keys';
import { entityRelationAggregatesQueryKey } from './query-keys';

import type { RelationAggregatesResponse } from '@granit/entities';

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
      const body =
        relations && relations.length > 0
          ? { relations: [...relations].sort((a, b) => a.localeCompare(b)) }
          : null;
      const { data } = await api.post<RelationAggregatesResponse>(
        `/api/v1/entities/${encodeURIComponent(entityName)}/${encodeURIComponent(entityId)}/relations/aggregates`,
        body,
        { signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName) && Boolean(entityId),
    staleTime: 30_000,
  });
}
