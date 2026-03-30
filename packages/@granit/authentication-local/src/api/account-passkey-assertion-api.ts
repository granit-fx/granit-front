import type { AxiosInstance } from 'axios';

/**
 * Begin a WebAuthn assertion ceremony for passkey login (anonymous).
 * Returns raw `PublicKeyCredentialRequestOptions` JSON string.
 * Assertion completion goes through `/connect/token` (OIDC layer).
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
