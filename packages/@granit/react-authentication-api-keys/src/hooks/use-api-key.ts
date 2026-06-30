import { getApiKey } from '@granit/authentication-api-keys';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';
import { logger } from '../logger';

import { buildApiKeyQueryKey } from './query-keys';

import type { ApiKeyHookOptions, ApiKeyQueryOptions } from './use-api-keys';
import type { ApiKeyResponse } from '@granit/authentication-api-keys';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches a single API key by ID.
 *
 * Calls `GET {basePath}/api-keys/{id}`.
 *
 * @param id - The API key ID to fetch.
 * @param options - Axios client and optional base path.
 * @param queryOptions - Optional TanStack Query overrides (e.g. `staleTime`).
 *
 * @example
 * ```tsx
 * const { data: apiKey, isLoading } = useApiKey('key-123', { client: api });
 * ```
 */
export function useApiKey(
  id: string,
  options: ApiKeyHookOptions,
  queryOptions?: ApiKeyQueryOptions
): UseQueryResult<ApiKeyResponse> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: buildApiKeyQueryKey(options, 'detail', id),
    queryFn: async () => {
      logger.debug(`fetching api key id=${id}`);
      const result = await getApiKey(client, basePath, id);
      logger.debug(`api key loaded id=${id}`);
      return result;
    },
    ...queryOptions,
    enabled: Boolean(id) && queryOptions?.enabled !== false,
  });
}
