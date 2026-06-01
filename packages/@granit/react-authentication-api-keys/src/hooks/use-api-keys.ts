import { listApiKeys } from '@granit/authentication-api-keys';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ApiKeyResponse } from '@granit/authentication-api-keys';
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

/** Query parameters for the paginated API key list. */
export interface UseApiKeysParams {
  search?: string;
  type?: string[];
  environment?: string;
  includeRevoked?: boolean;
  page?: number;
  pageSize?: number;
}

// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

const DEFAULT_QUERY_KEY_PREFIX = ['api-keys'] as const;

/**
 * Builds a query key for API key queries.
 *
 * @param config - Hook options containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildApiKeyQueryKey(
  config: Pick<ApiKeyHookOptions, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}

// ---------------------------------------------------------------------------
// Legacy query key factory (delegates to buildApiKeyQueryKey)
// ---------------------------------------------------------------------------

/** @deprecated Use {@link buildApiKeyQueryKey} instead. */
export const apiKeyKeys = {
  all: DEFAULT_QUERY_KEY_PREFIX as readonly string[],
  lists: () => [...DEFAULT_QUERY_KEY_PREFIX, 'list'] as const,
  list: (params: UseApiKeysParams) => [...DEFAULT_QUERY_KEY_PREFIX, 'list', params] as const,
  details: () => [...DEFAULT_QUERY_KEY_PREFIX, 'detail'] as const,
  detail: (id: string) => [...DEFAULT_QUERY_KEY_PREFIX, 'detail', id] as const,
};

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
): UseQueryResult<ApiKeyResponse[]> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: buildApiKeyQueryKey(options, 'list', params),
    queryFn: () => listApiKeys(client, basePath, params),
  });
}
