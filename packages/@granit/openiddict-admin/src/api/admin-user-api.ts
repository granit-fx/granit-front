import type {
  AdminImpersonationResponse,
  AdminUserListParams,
  AdminUserPage,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List admin users via the QueryEngine-backed admin endpoint.
 *
 * `GET {basePath}/users`
 *
 * Per-user CRUD lives under `/identity/provider/users/*` — see `@granit/identity`.
 */
export async function listUsers(
  client: AxiosInstance,
  basePath: string,
  params?: AdminUserListParams
): Promise<AdminUserPage> {
  const { data } = await client.get<AdminUserPage>(`${basePath}/users`, { params });
  return data;
}

/**
 * Impersonate a user. Returns short-lived tokens.
 *
 * `POST {basePath}/users/{id}/impersonate`
 */
export async function impersonateUser(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<AdminImpersonationResponse> {
  const { data } = await client.post<AdminImpersonationResponse>(
    `${basePath}/users/${encodeURIComponent(id)}/impersonate`
  );
  return data;
}
