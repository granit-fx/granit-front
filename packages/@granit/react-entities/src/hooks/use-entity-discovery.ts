import { useGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

export { entityDiscoveryQueryKey } from './query-keys';
import { entityDiscoveryQueryKey } from './query-keys';

import type { EntityDiscoveryResponse } from '@granit/entities';

const DISCOVERY_PATH = '/api/v1/entities';

/**
 * `GET /entities` — returns the discovery tree of every `EntityDefinition`
 * the requesting user has Read permission on, grouped by module. Mirrors
 * `Granit.Entities.Endpoints.EntitiesEndpoints.DiscoveryAsync`.
 *
 * Long staleTime — the catalogue is shaped by the host's module DI graph
 * and the user's granted permissions, neither of which churns mid-session.
 * The .NET handler caches the response 5 minutes per
 * `(user-perms-hash, culture)`, so even an aggressive React Query refetch
 * usually short-circuits at the FusionCache layer rather than hitting
 * the registry walk.
 */
export function useEntityDiscovery(
  options: { readonly enabled?: boolean } = {}
): UseQueryResult<EntityDiscoveryResponse> {
  const api = useGranitClient();
  return useQuery({
    queryKey: entityDiscoveryQueryKey(),
    queryFn: async ({ signal }) => {
      const { data } = await api.get<EntityDiscoveryResponse>(DISCOVERY_PATH, { signal });
      return data;
    },
    enabled: options.enabled ?? true,
    staleTime: 5 * 60_000,
  });
}
