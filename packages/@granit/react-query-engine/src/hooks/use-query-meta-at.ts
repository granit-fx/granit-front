// ---------------------------------------------------------------------------
// useQueryMetaAt — fetch metadata for an arbitrary query base path
//
// Companion to useQueryMeta (which reads the single endpoint from
// QueryProvider). Here the base path is chosen at runtime — typically a
// catalogue entry's resolved `basePath` — so an editor can load the fields
// of whichever query the user just selected.
// ---------------------------------------------------------------------------

import { getQueryMeta } from '@granit/query-engine';
import { useQuery } from '@tanstack/react-query';

import { useOptionalQueryCatalogConfig } from '../providers/query-catalog-provider';

import type { QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch query metadata for a base path resolved at runtime (e.g. a catalogue
 * entry). The Axios client comes from the nearest {@link QueryCatalogProvider}.
 *
 * Disabled (no data, no fetch) when `basePath` is `null` or no provider is
 * present — callers gate their field pickers on the returned `data`.
 *
 * @param basePath - The query's list-endpoint base path, or `null` when none
 *   is selected yet.
 */
export function useQueryMetaAt(basePath: string | null): UseQueryResult<QueryMetadata> {
  const config = useOptionalQueryCatalogConfig();
  const client = config?.client;

  return useQuery({
    queryKey: ['query-meta-at', basePath],
    queryFn: () => getQueryMeta(client!, basePath!),
    enabled: client != null && basePath != null,
    staleTime: Infinity,
  });
}
