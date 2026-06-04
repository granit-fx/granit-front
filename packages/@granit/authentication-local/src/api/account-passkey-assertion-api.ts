import type { AccountLoginResponse, AccountPasskeyLoginRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Begin a WebAuthn assertion ceremony for passkey login (anonymous).
 * Returns raw `PublicKeyCredentialRequestOptions` JSON string.
 *
 * The caller should pass these options to `navigator.credentials.get()`,
 * then submit the resulting credential via `completePasskeyAssertion()`.
 *
 * `POST {basePath}/passkeys/assertion/begin`
 */
export async function beginPasskeyAssertion(
  client: AxiosInstance,
  basePath: string
): Promise<string> {
  const { data } = await client.post<string>(`${basePath}/passkeys/assertion/begin`);
  return data;
}

/**
 * Complete a WebAuthn assertion ceremony for passkey login (anonymous).
 *
 * Submits the credential JSON obtained from `navigator.credentials.get()`
 * after `beginPasskeyAssertion()`. On success the server sets an ASP.NET
 * Core Identity session cookie.
 *
 * `POST {basePath}/passkeys/assertion/complete`
 */
export async function completePasskeyAssertion(
  client: AxiosInstance,
  basePath: string,
  request: AccountPasskeyLoginRequest
): Promise<AccountLoginResponse> {
  const { data } = await client.post<AccountLoginResponse>(
    `${basePath}/passkeys/assertion/complete`,
    request
  );
  return data;
}
