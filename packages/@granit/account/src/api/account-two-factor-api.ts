import type {
  AccountAuthenticatorKeyResponse,
  AccountGenerateRecoveryCodesRequest,
  AccountRecoveryCodesResponse,
  AccountTwoFactorDisableRequest,
  AccountTwoFactorEmailEnableRequest,
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
 * Disable 2FA for the current user. Requires the current password as step-up
 * authentication.
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
 * Generate new recovery codes (invalidates previous ones). Requires the current
 * password as step-up authentication.
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

/**
 * Send an enrollment code to the current user's email address to begin enabling
 * the email one-time-code factor.
 *
 * `POST {basePath}/two-factor/email/send`
 */
export async function sendTwoFactorEmailEnrollmentCode(
  client: AxiosInstance,
  basePath: string
): Promise<void> {
  await client.post(`${basePath}/two-factor/email/send`);
}

/**
 * Enable the email one-time-code factor by verifying the code sent via
 * {@link sendTwoFactorEmailEnrollmentCode}.
 *
 * `POST {basePath}/two-factor/email/enable`
 */
export async function enableTwoFactorEmail(
  client: AxiosInstance,
  basePath: string,
  request: AccountTwoFactorEmailEnableRequest
): Promise<void> {
  await client.post(`${basePath}/two-factor/email/enable`, request);
}

/**
 * Disable the email one-time-code factor. Requires the current password as
 * step-up authentication.
 *
 * `POST {basePath}/two-factor/email/disable`
 */
export async function disableTwoFactorEmail(
  client: AxiosInstance,
  basePath: string,
  request: AccountTwoFactorDisableRequest
): Promise<void> {
  await client.post(`${basePath}/two-factor/email/disable`, request);
}
