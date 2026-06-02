import { useGranitClient } from '@granit/react-api-client';
import { useQuery, useQueryClient, type UseQueryResult } from '@tanstack/react-query';

import { entityManifestQueryKey } from './query-keys';

import type { EntityFacet, EntityManifestResponse } from '@granit/entities';

interface ManifestCacheEntry {
  readonly manifest: EntityManifestResponse;
  readonly etag: string | null;
}

/**
 * `GET /entities/{name}` — returns the per-entity manifest. Mirrors
 * `Granit.Entities.Endpoints.EntitiesEndpoints.ManifestAsync`.
 *
 * Wired for HTTP 304: the .NET handler emits a strong ETag computed over
 * `(manifest, user-perms-hash, culture)`. The hook stashes that ETag
 * alongside the manifest in the React Query cache, sends it back as
 * `If-None-Match` on subsequent fetches, and recovers the cached manifest
 * when the server short-circuits with 304. That's the bandwidth saver
 * FusionCache aims for, and it works even after `staleTime` lapses.
 *
 * Pass `facets` to slim the response — the .NET handler omits the unwanted
 * sections from the payload (returns `null` for them), saving payload
 * size on screens that only need (say) identity + permissions.
 */
export function useEntityMetadata(
  name: string,
  options: { readonly facets?: readonly EntityFacet[]; readonly enabled?: boolean } = {}
): UseQueryResult<EntityManifestResponse> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  const facets = options.facets;
  const queryKey = entityManifestQueryKey(name, facets);

  return useQuery({
    queryKey,
    queryFn: async ({ signal }): Promise<ManifestCacheEntry> => {
      const cached = queryClient.getQueryData<ManifestCacheEntry>(queryKey);
      const headers: Record<string, string> = {};
      if (cached?.etag) {
        headers['If-None-Match'] = cached.etag;
      }

      const response = await api.get<EntityManifestResponse>(
        `/api/v1/entities/${encodeURIComponent(name)}`,
        {
          signal,
          params:
            facets && facets.length > 0
              ? { facets: [...facets].sort((a, b) => a.localeCompare(b)).join(',') }
              : undefined,
          headers,
          validateStatus: (status) => status === 304 || (status >= 200 && status < 300),
        }
      );

      if (response.status === 304 && cached) {
        return cached;
      }

      const etagHeader = response.headers['etag'];
      const etag = typeof etagHeader === 'string' ? etagHeader : null;
      return { manifest: response.data, etag };
    },
    select: (entry) => entry.manifest,
    enabled: (options.enabled ?? true) && Boolean(name),
    staleTime: 10 * 60_000,
  });
}
