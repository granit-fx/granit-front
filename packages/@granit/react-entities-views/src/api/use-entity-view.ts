import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { EntityViewResponse } from '@granit/entities-views';

/** Cache key for one saved view. */
export const entityViewQueryKey = (entityName: string, id: string) =>
  ['entities', 'views', entityName, 'item', id] as const;

/**
 * `GET /entities/{entityName}/views/{id}` — fetches one saved view by
 * id. Mirrors `EntityViewsEndpoints.GetByIdAsync`.
 *
 * 404 surfaces both for missing views and for views the caller cannot
 * access (defense-in-depth: same response shape, no scope leakage). The
 * underlying React Query result reports it as `isError`; consumers can
 * branch on `error.response.status === 404` for the not-found case.
 */
export function useEntityView(
  entityName: string,
  id: string,
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<EntityViewResponse> {
  const api = useGranitClient();
  return useQuery({
    queryKey: entityViewQueryKey(entityName, id),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EntityViewResponse>(
        `/entities/${encodeURIComponent(entityName)}/views/${encodeURIComponent(id)}`,
        { signal }
      );
      return data;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName) && Boolean(id),
    staleTime: 60_000,
  });
}
