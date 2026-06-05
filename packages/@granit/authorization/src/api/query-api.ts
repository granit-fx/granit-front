import { getPage, getQueryMeta } from '@granit/query-engine';

import type { PermissionGrant, RoleMetadata } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryMetadata, QueryRequest } from '@granit/query-engine';

/**
 * Queries the paginated / filterable list of permission grants.
 *
 * `GET {basePath}/grants` → `PagedResult<PermissionGrant>`
 * (backend policy: `Authorization.Grants.Manage`)
 */
export async function queryPermissionGrants(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {},
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<PermissionGrant>> {
  return getPage<PermissionGrant>(client, `${basePath}/grants`, request, options);
}

/**
 * Fetches the query metadata (columns, filterable fields, presets) for permission grants.
 *
 * `GET {basePath}/grants/meta` → `QueryMetadata`
 */
export async function getPermissionGrantMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/grants`, options);
}

/**
 * Queries the paginated / filterable list of role metadata.
 *
 * `GET {basePath}/role-metadata` → `PagedResult<RoleMetadata>`
 * (backend policy: `Authorization.Definitions.Read`)
 */
export async function queryRoleMetadata(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {},
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<RoleMetadata>> {
  return getPage<RoleMetadata>(client, `${basePath}/role-metadata`, request, options);
}

/**
 * Fetches the query metadata (columns, filterable fields, presets) for role metadata.
 *
 * `GET {basePath}/role-metadata/meta` → `QueryMetadata`
 */
export async function getRoleMetadataMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, `${basePath}/role-metadata`, options);
}
