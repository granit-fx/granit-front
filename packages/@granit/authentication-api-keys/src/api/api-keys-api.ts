import type {
  ApiKeyCreateRequest,
  ApiKeyCreateResponse,
  ApiKeyResponse,
  ApiKeyRotateResponse,
  ApiKeyUpdateScopesRequest,
  ListApiKeysParams,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Lists API keys filtered by the given parameters.
 *
 * `GET {basePath}/api-keys`
 */
export async function listApiKeys(
  client: AxiosInstance,
  basePath: string,
  params: ListApiKeysParams = {}
): Promise<ApiKeyResponse[]> {
  const response = await client.get<ApiKeyResponse[]>(`${basePath}/api-keys`, {
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
