import type {
  AccountPasskeyCreatedResponse,
  AccountPasskeyInfo,
  AccountPasskeyRegistrationRequest,
  AccountPasskeyRenameRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List all registered passkeys for the current user.
 *
 * `GET {basePath}/passkeys`
 */
export async function getPasskeys(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AccountPasskeyInfo[]> {
  const { data } = await client.get<readonly AccountPasskeyInfo[]>(`${basePath}/passkeys`);
  return data;
}

/**
 * Begin a WebAuthn passkey registration ceremony.
 * Returns raw `PublicKeyCredentialCreationOptions` JSON string.
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
 * Complete a WebAuthn passkey registration ceremony.
 *
 * `POST {basePath}/passkeys/register/complete`
 */
export async function completePasskeyRegistration(
  client: AxiosInstance,
  basePath: string,
  request: AccountPasskeyRegistrationRequest
): Promise<AccountPasskeyCreatedResponse> {
  const { data } = await client.post<AccountPasskeyCreatedResponse>(
    `${basePath}/passkeys/register/complete`,
    request
  );
  return data;
}

/**
 * Rename a passkey.
 *
 * `PATCH {basePath}/passkeys/{id}`
 */
export async function renamePasskey(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: AccountPasskeyRenameRequest
): Promise<void> {
  await client.patch(`${basePath}/passkeys/${encodeURIComponent(id)}`, request);
}

/**
 * Delete a passkey.
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
