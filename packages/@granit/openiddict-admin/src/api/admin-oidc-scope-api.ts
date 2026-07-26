import type {
  AdminOidcScopeResponse,
  AdminOidcCreateScopeRequest,
  AdminOidcScopeListParams,
  AdminOidcScopePage,
  AdminOidcUpdateScopeRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ── OIDC Scope CRUD ──────────────────────────────────────────────────────────

/**
 * List one page of OIDC scopes.
 *
 * `GET {basePath}/oidc/scopes`
 */
export async function listScopes(
  client: AxiosInstance,
  basePath: string,
  params?: AdminOidcScopeListParams
): Promise<AdminOidcScopePage> {
  const { data } = await client.get<AdminOidcScopePage>(`${basePath}/oidc/scopes`, { params });
  return data;
}

/**
 * Create a new OIDC scope.
 *
 * `POST {basePath}/oidc/scopes`
 */
export async function createScope(
  client: AxiosInstance,
  basePath: string,
  request: AdminOidcCreateScopeRequest
): Promise<AdminOidcScopeResponse> {
  const { data } = await client.post<AdminOidcScopeResponse>(`${basePath}/oidc/scopes`, request);
  return data;
}

/**
 * Update an OIDC scope by name.
 *
 * `PUT {basePath}/oidc/scopes/{scopeName}`
 */
export async function updateScope(
  client: AxiosInstance,
  basePath: string,
  scopeName: string,
  request: AdminOidcUpdateScopeRequest
): Promise<AdminOidcScopeResponse> {
  const { data } = await client.put<AdminOidcScopeResponse>(
    `${basePath}/oidc/scopes/${encodeURIComponent(scopeName)}`,
    request
  );
  return data;
}

/**
 * Delete an OIDC scope by name.
 *
 * `DELETE {basePath}/oidc/scopes/{scopeName}`
 */
export async function deleteScope(
  client: AxiosInstance,
  basePath: string,
  scopeName: string
): Promise<void> {
  await client.delete(`${basePath}/oidc/scopes/${encodeURIComponent(scopeName)}`);
}
