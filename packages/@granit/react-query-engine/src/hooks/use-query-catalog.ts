// ---------------------------------------------------------------------------
// useQueryCatalog — list every registered query definition (the catalogue)
// ---------------------------------------------------------------------------

import { getQueryCatalog } from '@granit/query-engine';
import { useQuery } from '@tanstack/react-query';

import { useOptionalQueryCatalogConfig } from '../providers/query-catalog-provider';

import type { QueryCatalogEntryResponse } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch the query catalogue from the nearest {@link QueryCatalogProvider}.
 *
 * The catalogue is static and cached with `staleTime: Infinity`. The query is
 * disabled (and stays `pending` with no data) when no provider is present, so
 * a query picker can fall back to free-text input.
 *
 * @example
 * ```tsx
 * const { data: queries } = useQueryCatalog();
 * ```
 */
export function useQueryCatalog(): UseQueryResult<readonly QueryCatalogEntryResponse[]> {
  const config = useOptionalQueryCatalogConfig();

  return useQuery({
    queryKey: ['query-catalog', config?.basePath],
    queryFn: () => getQueryCatalog(config!.client, config!.basePath),
    enabled: config != null,
    staleTime: Infinity,
  });
}
