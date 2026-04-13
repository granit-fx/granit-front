import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { ApiKeyResponse } from '@granit/authentication-api-keys';
import type { UseQueryResult } from '@tanstack/react-query';
import type { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options accepted by all hooks in this module. */
export interface ApiKeyHookOptions {
  /** Axios instance to use for HTTP requests. */
  client: AxiosInstance;
  /** API base path. Defaults to `/api/v1/authentication/api-keys`. */
  basePath?: string;
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
// Query key factory
// ---------------------------------------------------------------------------

/** Query key factory for API key queries. */
export const apiKeyKeys = {
  all: ['api-keys'] as const,
  lists: () => [...apiKeyKeys.all, 'list'] as const,
  list: (params: UseApiKeysParams) => [...apiKeyKeys.lists(), params] as const,
  details: () => [...apiKeyKeys.all, 'detail'] as const,
  detail: (id: string) => [...apiKeyKeys.details(), id] as const,
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
    queryKey: apiKeyKeys.list(params),
    queryFn: async () => {
      const response = await client.get<ApiKeyResponse[]>(basePath, {
        params: {
          search: params.search,
          type: params.type?.join(','),
          environment: params.environment,
          includeRevoked: params.includeRevoked,
          page: params.page,
          pageSize: params.pageSize,
        },
      });
      return response.data;
    },
  });
}
