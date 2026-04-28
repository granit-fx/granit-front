import type { AdminOidcAuthorization, AdminOidcAuthorizationListParams } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

// ── OIDC Authorization management ────────────────────────────────────────────

/**
 * List OIDC authorizations with optional filtering.
 *
 * `GET {basePath}/oidc/authorizations`
 */
export async function listAuthorizations(
  client: AxiosInstance,
  basePath: string,
  params?: AdminOidcAuthorizationListParams
): Promise<readonly AdminOidcAuthorization[]> {
  const { data } = await client.get<readonly AdminOidcAuthorization[]>(
    `${basePath}/oidc/authorizations`,
    { params }
  );
  return data;
}

/**
 * Revoke a single OIDC authorization by ID.
 *
 * `DELETE {basePath}/oidc/authorizations/{id}`
 */
export async function revokeAuthorization(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/oidc/authorizations/${encodeURIComponent(id)}`);
}

/**
 * Revoke all OIDC authorizations for a given user.
 *
 * `DELETE {basePath}/oidc/authorizations/user/{userId}`
 */
export async function revokeUserAuthorizations(
  client: AxiosInstance,
  basePath: string,
  userId: string
): Promise<void> {
  await client.delete(`${basePath}/oidc/authorizations/user/${encodeURIComponent(userId)}`);
}
