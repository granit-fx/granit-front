import type {
  PasskeyInfoResponse,
  PasskeyRegistrationRequest,
  PasskeyRenameRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List the authenticated user's registered passkeys.
 *
 * `GET {basePath}/passkeys`
 */
export async function listPasskeys(
  client: AxiosInstance,
  basePath: string
): Promise<PasskeyInfoResponse[]> {
  const { data } = await client.get<PasskeyInfoResponse[]>(`${basePath}/passkeys`);
  return data;
}

/**
 * Begin a WebAuthn passkey registration ceremony (authenticated).
 *
 * Returns raw `PublicKeyCredentialCreationOptions` JSON to pass to
 * `navigator.credentials.create()`, then submit via {@link completePasskeyRegistration}.
 *
 * `POST {basePath}/passkeys/register/begin`
 */
export async function beginPasskeyRegistration(
  client: AxiosInstance,
  basePath: string
): Promise<string> {
  const { data } = await client.post<string>(`${basePath}/passkeys/register/begin`);
  return data;
}

/**
 * Complete a WebAuthn passkey registration ceremony (authenticated).
 *
 * `POST {basePath}/passkeys/register/complete`
 */
export async function completePasskeyRegistration(
  client: AxiosInstance,
  basePath: string,
  request: PasskeyRegistrationRequest
): Promise<PasskeyInfoResponse> {
  const { data } = await client.post<PasskeyInfoResponse>(
    `${basePath}/passkeys/register/complete`,
    request
  );
  return data;
}

/**
 * Rename a registered passkey.
 *
 * `PATCH {basePath}/passkeys/{id}`
 */
export async function renamePasskey(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: PasskeyRenameRequest
): Promise<void> {
  await client.patch(`${basePath}/passkeys/${encodeURIComponent(id)}`, request);
}

/**
 * Delete a registered passkey. The server rejects deleting the last credential
 * when the account has no password (400).
 *
 * `DELETE {basePath}/passkeys/{id}`
 */
export async function deletePasskey(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/passkeys/${encodeURIComponent(id)}`);
}
