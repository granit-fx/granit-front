import { getDefaultEntityView } from '@granit/entities-views';
import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import type { EntityViewResponse } from '@granit/entities-views';

const ENTITIES_BASE_PATH = '/api/v1/entities';

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
    queryFn: ({ signal }) => getDefaultEntityView(api, ENTITIES_BASE_PATH, entityName, { signal }),
    enabled: (options.enabled ?? true) && Boolean(entityName),
    staleTime: 60_000,
  });
}
