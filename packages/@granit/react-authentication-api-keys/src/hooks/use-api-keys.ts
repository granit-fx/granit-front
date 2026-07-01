import { getApiKeysQueryMeta, listApiKeys } from '@granit/authentication-api-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { logger } from '../logger';

import { buildApiKeyQueryKey } from './query-keys';
import { useResolvedApiKeysConfig } from './use-api-keys-config';

import type { ApiKeyListPage, ListApiKeysParams } from '@granit/authentication-api-keys';
import type { QueryMetadata } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Options accepted by all hooks in this module. The Axios client is resolved
 * internally from the nearest `<ApiKeysProvider>`.
 */
export interface ApiKeyHookOptions {
  /** API base path. Defaults to `/api/v1/authentication`. */
  basePath?: string;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
}

/**
 * Query parameters for the paginated API key list.
 *
 * Alias of the core {@link ListApiKeysParams} (the QueryEngine grammar) —
 * exported under this name for consumers that import `UseApiKeysParams`.
 */
export type UseApiKeysParams = ListApiKeysParams;

/**
 * TanStack Query options consumers may override on the api-key query hooks
 * (e.g. `staleTime`, `enabled`, `refetchInterval`). Data-shape options
 * (`queryKey`, `queryFn`, `placeholderData`) are managed internally.
 */
export interface ApiKeyQueryOptions {
  staleTime?: number;
  gcTime?: number;
  enabled?: boolean;
  refetchInterval?: number | false;
  refetchOnWindowFocus?: boolean;
  retry?: boolean | number;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated, filterable list of API keys (QueryEngine-backed).
 *
 * Calls `GET {basePath}/api-keys` with the QueryEngine grammar derived from
 * `params`. Rows are {@link ApiKeyListItemResponse} summaries — they no longer
 * carry `permissions`/`allowedCidrs`; use {@link useApiKey} to load those for a
 * selected row.
 *
 * Keeps the previous page visible while the next one loads (no flash on page
 * change) and stays integrated with the TanStack Query cache, so the api-key
 * mutations' `invalidateQueries` refresh this list automatically. The fetch is
 * cancelled when the query is superseded (the request's `AbortSignal` is
 * forwarded to Axios).
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 * @param params - Optional QueryEngine parameters (`search`, `filters`,
 *   `quickFilters`, `sort`, `page`, `pageSize`). By default only active keys
 *   are returned.
 * @param queryOptions - Optional TanStack Query overrides (e.g. `staleTime`).
 *
 * @example
 * ```tsx
 * // Secret keys, including revoked ones, newest first.
 * const { data, isLoading } = useApiKeys(
 *   {},
 *   {
 *     search: 'labo',
 *     filters: [{ field: 'type', operator: 'Eq', value: 'Secret' }],
 *     quickFilters: [ApiKeyQuickFilters.IncludeRevoked],
 *     sort: [{ field: 'createdAt', direction: 'desc' }],
 *   },
 *   { staleTime: 60_000 }
 * );
 * ```
 */
export function useApiKeys(
  options: ApiKeyHookOptions = {},
  params: UseApiKeysParams = {},
  queryOptions?: ApiKeyQueryOptions
): UseQueryResult<ApiKeyListPage> {
  const config = useResolvedApiKeysConfig(options);

  return useQuery({
    queryKey: buildApiKeyQueryKey(config, 'list', params),
    queryFn: async ({ signal }) => {
      logger.debug('fetching api keys');
      const result = await listApiKeys(config.client, config.basePath, params, { signal });
      logger.debug(`api keys loaded count=${result.items.length}`);
      return result;
    },
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
}

/**
 * Fetches the QueryEngine metadata for the api-keys grid (columns, filterable
 * and sortable fields, quick filters, default sort, page size).
 *
 * Calls `GET {basePath}/api-keys/meta`. Useful to drive a generic, dynamically
 * configured DataGrid. Metadata is static, so it defaults to a long `staleTime`.
 *
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 * @param queryOptions - Optional TanStack Query overrides.
 */
export function useApiKeysQueryMeta(
  options: ApiKeyHookOptions = {},
  queryOptions?: ApiKeyQueryOptions
): UseQueryResult<QueryMetadata> {
  const config = useResolvedApiKeysConfig(options);

  return useQuery({
    queryKey: buildApiKeyQueryKey(config, 'meta'),
    queryFn: ({ signal }) => getApiKeysQueryMeta(config.client, config.basePath, { signal }),
    staleTime: Infinity,
    ...queryOptions,
  });
}
