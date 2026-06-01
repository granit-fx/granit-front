import type {
  AccountAuthenticatorKeyResponse,
  AccountRecoveryCodesResponse,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the current user's 2FA status.
 *
 * `GET {basePath}/two-factor`
 */
export async function getTwoFactorStatus(
  client: AxiosInstance,
  basePath: string
): Promise<AccountTwoFactorStatusResponse> {
  const { data } = await client.get<AccountTwoFactorStatusResponse>(`${basePath}/two-factor`);
  return data;
}

/**
 * Get the TOTP authenticator key and QR code URI for 2FA setup.
 *
 * `GET {basePath}/two-factor/authenticator-key`
 */
export async function getAuthenticatorKey(
  client: AxiosInstance,
  basePath: string
): Promise<AccountAuthenticatorKeyResponse> {
  const { data } = await client.get<AccountAuthenticatorKeyResponse>(
    `${basePath}/two-factor/authenticator-key`
  );
  return data;
}

/**
 * Enable 2FA by verifying a TOTP code. Returns recovery codes.
 *
 * `POST {basePath}/two-factor/enable`
 */
export async function enableTwoFactor(
  client: AxiosInstance,
  basePath: string,
  request: AccountTwoFactorEnableRequest
): Promise<AccountTwoFactorEnableResponse> {
  const { data } = await client.post<AccountTwoFactorEnableResponse>(
    `${basePath}/two-factor/enable`,
    request
  );
  return data;
}

/**
 * Disable 2FA for the current user.
 *
 * `POST {basePath}/two-factor/disable`
 */
export async function disableTwoFactor(client: AxiosInstance, basePath: string): Promise<void> {
  await client.post(`${basePath}/two-factor/disable`);
}

/**
 * Generate new recovery codes (invalidates previous ones).
 *
 * `POST {basePath}/two-factor/recovery-codes`
 */
export async function generateRecoveryCodes(
  client: AxiosInstance,
  basePath: string
): Promise<AccountRecoveryCodesResponse> {
  const { data } = await client.post<AccountRecoveryCodesResponse>(
    `${basePath}/two-factor/recovery-codes`
  );
  return data;
}
