import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { EntityViewResponse } from '@granit/entities-views';

/** Cache key for the resolved default saved view for an entity. */
export const defaultEntityViewQueryKey = (entityName: string) =>
  ['entities', 'views', entityName, 'default'] as const;

/**
 * `GET /entities/{entityName}/views/_default` — resolves the user's
 * effective default saved view per ADR-047 §4 precedence
 * (`isPersonalDefault` > `isDefault` > compiled fallback). Mirrors
 * `EntityViewsEndpoints.GetDefaultAsync`.
 *
 * The endpoint returns **204 No Content** when no saved or pinned view
 * exists — the renderer should fall back to the compiled default
 * collection. The hook normalises that into `null` so consumers can
 * just check `data === null` without inspecting the HTTP layer.
 *
 * 60-second staleTime so the answer is fresh after a personal-default
 * star change or a tenant-default flip elsewhere in the UI.
 */
export function useDefaultEntityView(
  entityName: string,
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<EntityViewResponse | null> {
  const api = useGranitClient();
  return useQuery({
    queryKey: defaultEntityViewQueryKey(entityName),
    queryFn: async ({ signal }) => {
      const response = await api.get<EntityViewResponse | ''>(
        `/api/v1/entities/${encodeURIComponent(entityName)}/views/_default`,
        { signal }
      );
      if (response.status === 204) {
        return null;
      }
      return response.data as EntityViewResponse;
    },
    enabled: (options.enabled ?? true) && Boolean(entityName),
    staleTime: 60_000,
  });
}
