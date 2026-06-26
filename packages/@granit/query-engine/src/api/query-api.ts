// ---------------------------------------------------------------------------
// Query API — data retrieval functions
// ---------------------------------------------------------------------------

import { serializeQueryRequest } from './query-param-serializer';

import type { QueryCatalogEntryResponse } from '../types/query-catalog';
import type { QueryMetadata } from '../types/query-metadata';
import type { QueryRequest } from '../types/query-params';
import type { GroupedResult, PagedResult } from '../types/query-results';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get a paginated page of results.
 *
 * @param client - Axios instance (from @granit/api-client)
 * @param basePath - API base path (e.g. "/api/v1/patients")
 * @param request - Query request parameters
 */
export async function getPage<T>(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest,
  options?: { readonly signal?: AbortSignal }
): Promise<PagedResult<T>> {
  const qs = serializeQueryRequest(request);
  const url = qs ? `${basePath}?${qs}` : basePath;
  const response = await client.get<PagedResult<T>>(url, options);
  return response.data;
}

/**
 * Get grouped results (when groupBy is specified).
 *
 * @param client - Axios instance (from @granit/api-client)
 * @param basePath - API base path (e.g. "/api/v1/patients")
 * @param request - Query request parameters (must include groupBy)
 */
export async function getGrouped<T>(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest,
  options?: { readonly signal?: AbortSignal }
): Promise<GroupedResult<T>> {
  const qs = serializeQueryRequest(request);
  const url = qs ? `${basePath}?${qs}` : basePath;
  const response = await client.get<GroupedResult<T>>(url, options);
  return response.data;
}

/**
 * Get query metadata (columns, filterable fields, presets, etc.).
 *
 * @param client - Axios instance (from @granit/api-client)
 * @param basePath - API base path (e.g. "/api/v1/patients")
 */
export async function getQueryMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  const response = await client.get<QueryMetadata>(`${basePath}/meta`, options);
  return response.data;
}

/**
 * List every registered query definition (the query catalogue).
 *
 * Powers a query picker in the dashboard editor instead of a free-text
 * `queryName`. Each entry's `basePath` (when non-null) can be passed to
 * {@link getQueryMeta} to load that query's fields.
 *
 * @param client - Axios instance (from @granit/api-client)
 * @param basePath - Query-engine root path where `/catalog` is mounted
 */
export async function getQueryCatalog(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<readonly QueryCatalogEntryResponse[]> {
  const response = await client.get<readonly QueryCatalogEntryResponse[]>(
    `${basePath}/catalog`,
    options
  );
  return response.data;
}
