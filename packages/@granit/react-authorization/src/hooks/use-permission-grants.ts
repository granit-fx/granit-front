import { getPermissionGrantMeta, queryPermissionGrants } from '@granit/authorization';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { buildPermissionQueryKey } from './query-keys';
import { useResolvedAuthorizationConfig } from './use-authorization-config';

import type { UsePermissionGrantsOptions } from '../types';
import type { PermissionGrant } from '@granit/authorization';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the paginated / filterable list of permission grants.
 *
 * Calls `GET {basePath}/grants` (default `/api/v1/authorization/grants`).
 * Keeps the previous page visible while the next one loads.
 *
 * @param options - Axios client instance and optional configuration.
 * @param request - Optional query request (pagination, filters, sort, search).
 * @returns Standard React Query result with a `PagedResult<PermissionGrant>`.
 *
 * @example
 * ```tsx
 * const { data } = usePermissionGrants({ client: api }, { search: 'admin' });
 * // data.items, data.totalCount, data.hasMore
 * ```
 */
export function usePermissionGrants(
  options: UsePermissionGrantsOptions = {},
  request: QueryRequest = {}
): UseQueryResult<PagedResult<PermissionGrant>> {
  const { enabled } = options;
  const config = useResolvedAuthorizationConfig(options);

  return useQuery({
    queryKey: buildPermissionQueryKey(config, 'grants', request),
    queryFn: ({ signal }) => queryPermissionGrants(config.client, config.basePath, request, { signal }),
    enabled: enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches the query metadata (columns, filterable fields, presets) for permission grants.
 *
 * Calls `GET {basePath}/grants/meta` (default `/api/v1/authorization/grants/meta`).
 *
 * @param options - Axios client instance and optional configuration.
 * @returns Standard React Query result with the query metadata.
 */
export function usePermissionGrantMeta(
  options: UsePermissionGrantsOptions = {}
): UseQueryResult<QueryMetadata> {
  const { enabled } = options;
  const config = useResolvedAuthorizationConfig(options);

  return useQuery({
    queryKey: buildPermissionQueryKey(config, 'grants', 'meta'),
    queryFn: ({ signal }) => getPermissionGrantMeta(config.client, config.basePath, { signal }),
    enabled: enabled ?? true,
    staleTime: Infinity,
  });
}
