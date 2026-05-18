import { listEntityViews } from '@granit/entities-views';
import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { EntityViewResponse } from '@granit/entities-views';

const ENTITIES_BASE_PATH = '/api/v1/entities';

/**
 * Cache key for the saved-view list of one entity. Keyed by the
 * entity's wire identifier so a permission change can invalidate every
 * variant via the prefix `['entities', 'views', entityName]`.
 */
export const entityViewsQueryKey = (entityName: string) =>
  ['entities', 'views', entityName, 'list'] as const;

/**
 * `GET /entities/{entityName}/views` — returns every saved view the
 * caller can access for the given entity (Personal owned by them,
 * Shared targeted at them by role / user id, every Tenant). Sorted by
 * `sortOrder` ascending then `name`. Mirrors
 * `Granit.Entities.Views.Endpoints.EntityViewsEndpoints.ListAsync`.
 *
 * Short staleTime (60 s) — saved views change quickly through the tab
 * strip (save-as-new, pin, share), so a stale list would surface a
 * deleted or freshly-promoted view to the renderer. The CRUD hooks in
 * this package invalidate the prefix on every mutation.
 */
export function useEntityViews(
  entityName: string,
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<readonly EntityViewResponse[]> {
  const api = useGranitClient();
  return useQuery({
    queryKey: entityViewsQueryKey(entityName),
    queryFn: ({ signal }) => listEntityViews(api, ENTITIES_BASE_PATH, entityName, { signal }),
    enabled: (options.enabled ?? true) && Boolean(entityName),
    staleTime: 60_000,
  });
}
