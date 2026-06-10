import type {
  AccountExternalLoginCallbackResponse,
  AccountExternalLoginInfo,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';
import { HttpError, isAxiosError } from '@granit/api-client';

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
 * Process the external login callback after OAuth redirect.
 *
 * `GET {basePath}/external-logins/callback?provider=...`
 */
export async function externalLoginCallback(
  client: AxiosInstance,
  basePath: string,
  provider: string
): Promise<AccountExternalLoginCallbackResponse> {
  const { data } = await client.get<AccountExternalLoginCallbackResponse>(
    `${basePath}/external-logins/callback`,
    { params: { provider } }
  );
  return data;
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
