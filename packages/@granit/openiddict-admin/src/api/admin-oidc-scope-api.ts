import type { AdminOidcScope, AdminOidcScopeCreateRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ── OIDC Scope CRUD ──────────────────────────────────────────────────────────

/**
 * List all OIDC scopes.
 *
 * `GET {basePath}/oidc/scopes`
 */
export async function listScopes(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AdminOidcScope[]> {
  const { data } = await client.get<readonly AdminOidcScope[]>(`${basePath}/oidc/scopes`);
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
  request: AdminOidcScopeCreateRequest
): Promise<AdminOidcScope> {
  const { data } = await client.post<AdminOidcScope>(`${basePath}/oidc/scopes`, request);
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
