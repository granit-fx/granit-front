import { HttpError, isAxiosError } from '@granit/api-client';

import type {
  AccountCompleteExternalRegistrationRequest,
  AccountExternalLoginCallbackResponse,
  AccountExternalLoginInfo,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List linked external login providers for the current user.
 *
 * `GET {basePath}/external-logins`
 */
export async function getExternalLogins(
  client: AxiosInstance,
  basePath: string
): Promise<readonly AccountExternalLoginInfo[]> {
  const { data } = await client.get<readonly AccountExternalLoginInfo[]>(
    `${basePath}/external-logins`
  );
  return data;
}

/**
 * Initiate an OAuth challenge with an external provider.
 *
 * `POST {basePath}/external-logins/challenge/{provider}`
 *
 * @throws {HttpError} status 400 — provider unknown / not configured in the registry
 * @throws {HttpError} status 500 — provider configured but authentication handler not registered
 */
export async function challengeExternalLogin(
  client: AxiosInstance,
  basePath: string,
  provider: string
): Promise<void> {
  try {
    await client.post(`${basePath}/external-logins/challenge/${encodeURIComponent(provider)}`);
  } catch (err) {
    if (isAxiosError(err)) {
      const status = err.response?.status;
      if (status === 400) {
        throw new HttpError(
          `External login provider "${provider}" is not configured.`,
          400,
          err.response?.data
        );
      }
      if (status === 500) {
        throw new HttpError(
          `External login provider "${provider}" is unavailable: the authentication handler is not registered.`,
          500,
          err.response?.data
        );
      }
    }
    throw err;
  }
}

/**
 * Build the browser-navigation URL that starts an external login challenge.
 *
 * `GET {basePath}/external-logins/challenge/{provider}/start?returnUrl=...`
 *
 * The endpoint responds with a `302` to the provider, so this URL is meant for
 * a top-level navigation (`window.location.assign(...)`), NOT an XHR.
 *
 * @param returnUrl optional relative URL the backend redirects to after the flow.
 */
export function getExternalLoginStartUrl(
  basePath: string,
  provider: string,
  returnUrl?: string
): string {
  const url = `${basePath}/external-logins/challenge/${encodeURIComponent(provider)}/start`;
  if (returnUrl == null || returnUrl === '') {
    return url;
  }
  const query = new URLSearchParams({ returnUrl });
  return `${url}?${query.toString()}`;
}

/**
 * Process the external login callback headlessly after the OAuth redirect.
 *
 * `GET {basePath}/external-logins/callback?provider=...&mode=json`
 *
 * `mode=json` forces a JSON body instead of a server-side redirect. Legacy
 * `{ userId, isNewUser }` payloads are normalized to the `completed` variant.
 */
export async function externalLoginCallback(
  client: AxiosInstance,
  basePath: string,
  provider: string
): Promise<AccountExternalLoginCallbackResponse> {
  const { data } = await client.get<AccountExternalLoginCallbackResponse | LegacyCallbackResponse>(
    `${basePath}/external-logins/callback`,
    { params: { provider, mode: 'json' } }
  );

  if ('status' in data) {
    return data;
  }

  // Legacy shape: { userId, isNewUser } → completed variant.
  return {
    status: 'completed',
    userId: data.userId,
    isNewUser: data.isNewUser,
    continuationToken: null,
    prefill: null,
  };
}

/** Pre-#2613 callback payload, normalized by {@link externalLoginCallback}. */
interface LegacyCallbackResponse {
  readonly userId: string;
  readonly isNewUser: boolean;
}

/**
 * Complete an external login registration that required profile completion.
 *
 * `POST {basePath}/external-logins/complete-registration`
 *
 * Establishes the session server-side on success (`200`).
 *
 * @throws {HttpError} 400 — token invalid/expired
 * @throws {HttpError} 403 — self-registration disabled or tenant mismatch
 * @throws {HttpError} 409 — email already taken
 * @throws {HttpError} 422 — email differs from the provider-verified email / validation
 */
export async function completeExternalRegistration(
  client: AxiosInstance,
  basePath: string,
  request: AccountCompleteExternalRegistrationRequest
): Promise<void> {
  await client.post(`${basePath}/external-logins/complete-registration`, request);
}

/**
 * Unlink an external login provider from the current user.
 *
 * `DELETE {basePath}/external-logins/{provider}`
 */
export async function unlinkExternalLogin(
  client: AxiosInstance,
  basePath: string,
  provider: string
): Promise<void> {
  await client.delete(`${basePath}/external-logins/${encodeURIComponent(provider)}`);
}
