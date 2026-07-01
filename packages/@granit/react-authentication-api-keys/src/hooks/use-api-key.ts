import { getApiKey } from '@granit/authentication-api-keys';
import { useQuery } from '@tanstack/react-query';

import { logger } from '../logger';

import { buildApiKeyQueryKey } from './query-keys';
import { useResolvedApiKeysConfig } from './use-api-keys-config';

import type { ApiKeyHookOptions, ApiKeyQueryOptions } from './use-api-keys';
import type { ApiKeyResponse } from '@granit/authentication-api-keys';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches a single API key by ID.
 *
 * Calls `GET {basePath}/api-keys/{id}`.
 *
 * @param id - The API key ID to fetch.
 * @param options - Optional base path / query-key prefix. The Axios client is
 *   resolved from the nearest `<ApiKeysProvider>`.
 * @param queryOptions - Optional TanStack Query overrides (e.g. `staleTime`).
 *
 * @example
 * ```tsx
 * const { data: apiKey, isLoading } = useApiKey('key-123');
 * ```
 */
export function useApiKey(
  id: string,
  options: ApiKeyHookOptions = {},
  queryOptions?: ApiKeyQueryOptions
): UseQueryResult<ApiKeyResponse> {
  const config = useResolvedApiKeysConfig(options);

  return useQuery({
    queryKey: buildApiKeyQueryKey(config, 'detail', id),
    queryFn: async () => {
      logger.debug(`fetching api key id=${id}`);
      const result = await getApiKey(config.client, config.basePath, id);
      logger.debug(`api key loaded id=${id}`);
      return result;
    },
    ...queryOptions,
    enabled: Boolean(id) && queryOptions?.enabled !== false,
  });
}
