import type { AccountLoginRequest, AccountLoginResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Authenticate a user via local credentials (email/username + password).
 *
 * On success, the server sets an ASP.NET Core Identity session cookie.
 * The caller should then redirect to the OIDC authorization endpoint
 * (`/connect/authorize`) to complete the token exchange.
 *
 * The Axios instance must have `withCredentials: true` for the browser
 * to accept the `Set-Cookie` header from the server.
 *
 * `POST {basePath}/login`
 */
export async function loginAccount(
  client: AxiosInstance,
  basePath: string,
  request: AccountLoginRequest
): Promise<AccountLoginResponse> {
  const { data } = await client.post<AccountLoginResponse>(`${basePath}/login`, request);
  return data;
}
