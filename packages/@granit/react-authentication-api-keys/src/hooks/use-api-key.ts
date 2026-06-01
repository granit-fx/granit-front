import { getApiKey } from '@granit/authentication-api-keys';
import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import { buildApiKeyQueryKey } from './use-api-keys';

import type { ApiKeyHookOptions } from './use-api-keys';
import type { ApiKeyResponse } from '@granit/authentication-api-keys';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches a single API key by ID.
 *
 * Calls `GET {basePath}/{id}`.
 *
 * @param id - The API key ID to fetch.
 * @param options - Axios client and optional base path.
 *
 * @example
 * ```tsx
 * const { data: apiKey, isLoading } = useApiKey('key-123', { client: api });
 * ```
 */
export function useApiKey(id: string, options: ApiKeyHookOptions): UseQueryResult<ApiKeyResponse> {
  const { client, basePath = DEFAULT_BASE_PATH } = options;

  return useQuery({
    queryKey: buildApiKeyQueryKey(options, 'detail', id),
    queryFn: () => getApiKey(client, basePath, id),
    enabled: Boolean(id),
  });
}
