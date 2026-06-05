import { getRoleMetadataMeta, queryRoleMetadata } from '@granit/authorization';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { DEFAULT_BASE_PATH } from '../constants';

import { buildPermissionQueryKey } from './query-keys';

import type { UseRoleMetadataOptions } from '../types';
import type { RoleMetadata } from '@granit/authorization';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetches the paginated / filterable list of role metadata.
 *
 * Calls `GET {basePath}/role-metadata` (default `/api/v1/authorization/role-metadata`).
 * Keeps the previous page visible while the next one loads.
 *
 * @param options - Axios client instance and optional configuration.
 * @param request - Optional query request (pagination, filters, sort, search).
 * @returns Standard React Query result with a `PagedResult<RoleMetadata>`.
 *
 * @example
 * ```tsx
 * const { data } = useRoleMetadata({ client: api }, { sort: [{ field: 'name', direction: 'asc' }] });
 * // data.items, data.totalCount, data.hasMore
 * ```
 */
export function useRoleMetadata(
  options: UseRoleMetadataOptions,
  request: QueryRequest = {}
): UseQueryResult<PagedResult<RoleMetadata>> {
  const { client, basePath = DEFAULT_BASE_PATH, enabled } = options;

  return useQuery({
    queryKey: buildPermissionQueryKey(options, 'role-metadata', request),
    queryFn: ({ signal }) => queryRoleMetadata(client, basePath, request, { signal }),
    enabled: enabled ?? true,
    placeholderData: keepPreviousData,
  });
}

/**
 * Fetches the query metadata (columns, filterable fields, presets) for role metadata.
 *
 * Calls `GET {basePath}/role-metadata/meta` (default `/api/v1/authorization/role-metadata/meta`).
 *
 * @param options - Axios client instance and optional configuration.
 * @returns Standard React Query result with the query metadata.
 */
export function useRoleMetadataMeta(
  options: UseRoleMetadataOptions
): UseQueryResult<QueryMetadata> {
  const { client, basePath = DEFAULT_BASE_PATH, enabled } = options;

  return useQuery({
    queryKey: buildPermissionQueryKey(options, 'role-metadata', 'meta'),
    queryFn: ({ signal }) => getRoleMetadataMeta(client, basePath, { signal }),
    enabled: enabled ?? true,
    staleTime: Infinity,
  });
}
