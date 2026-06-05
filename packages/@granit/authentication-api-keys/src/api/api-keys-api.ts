import { getPage, getQueryMeta } from '@granit/query-engine';

import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyListItemResponse,
  ApiKeyListPage,
  ApiKeyResponse,
  ApiKeyRotateResponse,
  ApiKeyUpdateScopesRequest,
  ListApiKeysParams,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import type { QueryMetadata } from '@granit/query-engine';

/** Sub-path of the QueryEngine listing surface, relative to the module base. */
const API_KEYS_PATH = 'api-keys';

function apiKeysQueryPath(basePath: string): string {
  return `${basePath}/${API_KEYS_PATH}`;
}

/**
 * Lists API keys via the generic QueryEngine surface.
 *
 * `GET {basePath}/api-keys` → `PagedResult<ApiKeyListItemResponse>` — a summary
 * projection without `permissions`/`allowedCidrs`. Pass the QueryEngine grammar
 * via {@link ListApiKeysParams} (`page`, `pageSize`, `sort`, `search`,
 * `filters`, `quickFilters`); by default only active keys are returned.
 */
export async function listApiKeys(
  client: AxiosInstance,
  basePath: string,
  params: ListApiKeysParams = {},
  options?: { readonly signal?: AbortSignal }
): Promise<ApiKeyListPage> {
  return getPage<ApiKeyListItemResponse>(client, apiKeysQueryPath(basePath), params, options);
}

/**
 * Gets the QueryEngine metadata (columns, filterable/sortable fields, quick
 * filters, default sort, page size) for the api-keys grid.
 *
 * `GET {basePath}/api-keys/meta`
 */
export async function getApiKeysQueryMeta(
  client: AxiosInstance,
  basePath: string,
  options?: { readonly signal?: AbortSignal }
): Promise<QueryMetadata> {
  return getQueryMeta(client, apiKeysQueryPath(basePath), options);
}

/**
 * Fetches a single API key by id.
 *
 * `GET {basePath}/api-keys/{id}`
 */
export async function getApiKey(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ApiKeyResponse> {
  const response = await client.get<ApiKeyResponse>(`${basePath}/api-keys/${id}`);
  return response.data;
}

/**
 * Creates a new API key.
 *
 * `POST {basePath}/api-keys`
 */
export async function createApiKey(
  client: AxiosInstance,
  basePath: string,
  request: ApiKeyCreateRequest
): Promise<ApiKeyCreateResponse> {
  const response = await client.post<ApiKeyCreateResponse>(`${basePath}/api-keys`, request);
  return response.data;
}

/**
 * Revokes an API key.
 *
 * `POST {basePath}/api-keys/{id}/revoke`
 */
export async function revokeApiKey(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.post(`${basePath}/api-keys/${id}/revoke`);
}

/**
 * Rotates an API key, generating a new raw secret.
 *
 * `POST {basePath}/api-keys/{id}/rotate`
 */
export async function rotateApiKey(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ApiKeyRotateResponse> {
  const response = await client.post<ApiKeyRotateResponse>(`${basePath}/api-keys/${id}/rotate`);
  return response.data;
}

/**
 * Updates the permissions and allowed CIDRs of an API key.
 *
 * `PUT {basePath}/api-keys/{id}/scopes`
 */
export async function updateApiKeyScopes(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ApiKeyUpdateScopesRequest
): Promise<void> {
  await client.put(`${basePath}/api-keys/${id}/scopes`, request);
}
