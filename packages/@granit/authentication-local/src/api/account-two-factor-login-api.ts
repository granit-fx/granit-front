import type { AccountLoginResponse, AccountTwoFactorLoginRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Complete a two-factor login after the initial login returned
 * `requiresTwoFactor: true`.
 *
 * The server identifies the user via the `Identity.TwoFactorUserId` cookie
 * set during `POST {basePath}/login`. Spaces and dashes are stripped from
 * the code server-side (authenticator app formatting).
 *
 * Set `request.method` to pick the factor the `code` belongs to
 * (`"Authenticator"` — the default — `"RecoveryCode"`, or `"Email"`). Only
 * offer methods listed in the login response's `twoFactorMethods`.
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

/**
 * Send a one-time code by email to the user currently pending two-factor login.
 *
 * Anonymous: the server identifies the pending user via the two-factor session
 * cookie set during `POST {basePath}/login`. The code is only sent if the user
 * has enrolled the email factor — otherwise the call is a silent no-op (still
 * `204`). Returns `400` when there is no active two-factor session.
 *
 * Call this when the user picks `"Email"` from the login response's
 * `twoFactorMethods`, then submit the received code via {@link verifyTwoFactorLogin}
 * with `method: "Email"`.
 *
 * `POST {basePath}/login/two-factor/send-email`
 */
export async function sendTwoFactorLoginEmailCode(
  client: AxiosInstance,
  basePath: string
): Promise<void> {
  await client.post(`${basePath}/login/two-factor/send-email`);
}
