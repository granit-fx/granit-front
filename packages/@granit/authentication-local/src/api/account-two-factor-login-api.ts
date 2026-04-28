import type { AccountLoginResponse, AccountTwoFactorLoginRequest } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Complete a two-factor login after the initial login returned
 * `requiresTwoFactor: true`.
 *
 * The server identifies the user via the `Identity.TwoFactorUserId` cookie
 * set during `POST {basePath}/login`. Spaces and dashes are stripped from
 * the code server-side (authenticator app formatting).
 *
 * Set `useRecoveryCode: true` to use a single-use recovery code instead
 * of a TOTP code.
 *
 * `POST {basePath}/login/two-factor`
 */
export async function verifyTwoFactorLogin(
  client: AxiosInstance,
  basePath: string,
  request: AccountTwoFactorLoginRequest
): Promise<AccountLoginResponse> {
  const { data } = await client.post<AccountLoginResponse>(`${basePath}/login/two-factor`, request);
  return data;
}
