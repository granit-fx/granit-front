import type {
  AdminOidcAuthorizationResponse,
  AdminOidcCreateAuthorizationRequest,
  AdminOidcAuthorizationListParams,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

// ── OIDC Authorization management ────────────────────────────────────────────

/**
 * Create an OIDC authorization (admin consent grant).
 *
 * `POST {basePath}/oidc/authorizations`
 */
export async function createAuthorization(
  client: AxiosInstance,
  basePath: string,
  request: AdminOidcCreateAuthorizationRequest
): Promise<AdminOidcAuthorizationResponse> {
  const { data } = await client.post<AdminOidcAuthorizationResponse>(
    `${basePath}/oidc/authorizations`,
    request
  );
  return data;
}

/**
 * List OIDC authorizations with optional filtering.
 *
 * `GET {basePath}/oidc/authorizations`
 */
export async function listAuthorizations(
  client: AxiosInstance,
  basePath: string,
  params?: AdminOidcAuthorizationListParams
): Promise<readonly AdminOidcAuthorizationResponse[]> {
  const { data } = await client.get<readonly AdminOidcAuthorizationResponse[]>(
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
