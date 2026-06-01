// ---------------------------------------------------------------------------
// useQueryMeta — fetch and cache query metadata (Story #48)
// ---------------------------------------------------------------------------

import { buildQueryKey, getQueryMeta } from '@granit/query-engine';
import { useQuery } from '@tanstack/react-query';

import { useQueryConfig } from '../providers/query-provider';

import type { QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch query metadata for the current endpoint.
 *
 * Metadata is considered static and cached with `staleTime: Infinity`
 * (refetched only on mount or manual invalidation).
 *
 * @example
 * ```tsx
 * const { data: meta, isLoading } = useQueryMeta();
 * ```
 */
export function useQueryMeta(): UseQueryResult<QueryMetadata> {
  const config = useQueryConfig();

  return useQuery({
    queryKey: buildQueryKey(config, 'meta'),
    queryFn: () => getQueryMeta(config.client, config.basePath),
    staleTime: Infinity,
  });
}
