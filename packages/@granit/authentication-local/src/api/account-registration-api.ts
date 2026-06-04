import type { AccountRegisterRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Register a new local account.
 *
 * Returns 202 Accepted; when email confirmation is enabled the server sends a
 * confirmation link. Requires self-registration to be enabled.
 *
 * `POST {basePath}/register`
 */
export async function registerAccount(
  client: AxiosInstance,
  basePath: string,
  request: AccountRegisterRequest
): Promise<void> {
  await client.post(`${basePath}/register`, request);
}

/**
 * Confirm a newly registered account's email address.
 *
 * Called from the link the server e-mailed after {@link registerAccount}.
 *
 * `GET {basePath}/confirm-email?userId={userId}&token={token}`
 */
export async function confirmEmail(
  client: AxiosInstance,
  basePath: string,
  userId: string,
  token: string
): Promise<void> {
  await client.get(`${basePath}/confirm-email`, { params: { userId, token } });
}

/**
 * Resend the email-confirmation link for the authenticated account.
 *
 * `POST {basePath}/resend-confirmation-email`
 */
export async function resendConfirmationEmail(
  client: AxiosInstance,
  basePath: string
): Promise<void> {
  await client.post(`${basePath}/resend-confirmation-email`);
}
