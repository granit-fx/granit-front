import { listApiKeys } from '@granit/authentication-api-keys';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import { buildApiKeyQueryKey } from './query-keys';

import type { AxiosInstance } from '@granit/api-client';
import type { ApiKeyResponse, ListApiKeysParams } from '@granit/authentication-api-keys';
import type { PagedResult } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options accepted by all hooks in this module. */
export interface ApiKeyHookOptions {
  /** Axios instance to use for HTTP requests. */
  client: AxiosInstance;
  /** API base path. Defaults to `/api/v1/authentication`. */
  basePath?: string;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
}

/**
 * Query parameters for the paginated API key list.
 *
 * Alias of the core {@link ListApiKeysParams} — exported under this name for
 * consumers that import `UseApiKeysParams`.
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
 * Fetches a paginated, filterable list of API keys.
 *
 * Calls `GET {basePath}` with query parameters derived from `params`.
 *
 * Keeps the previous page visible while the next one loads (no flash on page
 * change) and stays integrated with the TanStack Query cache, so the api-key
 * mutations' `invalidateQueries` refresh this list automatically.
 *
 * @param options - Axios client and optional base path.
 * @param params - Optional search/filter/pagination parameters.
 * @param queryOptions - Optional TanStack Query overrides (e.g. `staleTime`).
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApiKeys(
 *   { client: api },
 *   { environment: 'production', type: 'Secret' },
 *   { staleTime: 60_000 }
 * );
 * ```
 */
export function useApiKeys(
  options: ApiKeyHookOptions,
  params: UseApiKeysParams = {},
  queryOptions?: ApiKeyQueryOptions
): UseQueryResult<PagedResult<ApiKeyResponse>> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: buildApiKeyQueryKey(options, 'list', params),
    queryFn: () => listApiKeys(client, basePath, params),
    placeholderData: keepPreviousData,
    ...queryOptions,
  });
}
