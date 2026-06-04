import type {
  AccountAuthenticatorKeyResponse,
  AccountGenerateRecoveryCodesRequest,
  AccountRecoveryCodesResponse,
  AccountTwoFactorDisableRequest,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Get the authenticated user's two-factor status.
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
 * Get (or generate) the TOTP shared key and `otpauth://` QR-code URI.
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
 * Enable two-factor after verifying a TOTP code. Returns recovery codes.
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
 * Disable two-factor (step-up: password).
 *
 * `POST {basePath}/two-factor/disable`
 */
export async function disableTwoFactor(
  client: AxiosInstance,
  basePath: string,
  request: AccountTwoFactorDisableRequest
): Promise<void> {
  await client.post(`${basePath}/two-factor/disable`, request);
}

/**
 * Regenerate the single-use recovery codes (step-up: password). Invalidates
 * any previously issued codes.
 *
 * `POST {basePath}/two-factor/recovery-codes`
 */
export async function generateRecoveryCodes(
  client: AxiosInstance,
  basePath: string,
  request: AccountGenerateRecoveryCodesRequest
): Promise<AccountRecoveryCodesResponse> {
  const { data } = await client.post<AccountRecoveryCodesResponse>(
    `${basePath}/two-factor/recovery-codes`,
    request
  );
  return data;
}
