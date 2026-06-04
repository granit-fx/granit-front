import type { AccountRegisterRequest } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * Register a new user account. Responds `202 Accepted` with no body —
 * registration is processed asynchronously and any email-confirmation
 * requirement is surfaced via `GET /config` (see {@link getAccountSettings}).
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
 * Confirm an email address using the token from the confirmation email.
 *
 * `GET {basePath}/confirm-email?userId=...&token=...`
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
 * Resend the email confirmation link (authenticated).
 *
 * `POST {basePath}/resend-confirmation-email`
 */
export async function resendConfirmationEmail(
  client: AxiosInstance,
  basePath: string
): Promise<void> {
  await client.post(`${basePath}/resend-confirmation-email`);
}
