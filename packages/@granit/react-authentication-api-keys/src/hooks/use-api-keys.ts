import { listApiKeys } from '@granit/authentication-api-keys';
import { useQuery } from '@tanstack/react-query';

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches a paginated, filterable list of API keys.
 *
 * Calls `GET {basePath}` with query parameters derived from `params`.
 *
 * @param options - Axios client and optional base path.
 * @param params - Optional search/filter/pagination parameters.
 *
 * @example
 * ```tsx
 * const { data, isLoading } = useApiKeys(
 *   { client: api },
 *   { environment: 'production', type: ['Secret'] }
 * );
 * ```
 */
export function useApiKeys(
  options: ApiKeyHookOptions,
  params: UseApiKeysParams = {}
): UseQueryResult<PagedResult<ApiKeyResponse>> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: buildApiKeyQueryKey(options, 'list', params),
    queryFn: () => listApiKeys(client, basePath, params),
  });
}
